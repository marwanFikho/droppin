import { json } from "@remix-run/node";
import prisma from "../db.server";

const SHOPIFY_API_VERSION = "2025-04";

function normalizeOrderGid(shopifyOrderId) {
  if (!shopifyOrderId) return null;
  if (shopifyOrderId.startsWith("gid://shopify/Order/")) return shopifyOrderId;
  const numeric = String(shopifyOrderId).match(/\d+/)?.[0];
  return numeric ? `gid://shopify/Order/${numeric}` : null;
}

function extractOrderNumericId(shopifyOrderId) {
  if (!shopifyOrderId) return null;
  return String(shopifyOrderId).match(/\d+/)?.[0] || null;
}

async function shopifyGraphql(shopDomain, accessToken, query, variables = {}) {
  const res = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(`Shopify GraphQL HTTP ${res.status}: ${JSON.stringify(payload)}`);
  }
  if (payload.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }
  return payload.data;
}

/**
 * POST /api/fulfillment
 * Webhook endpoint called by Droppin backend when a package is delivered
 * Marks the corresponding Shopify order as fulfilled
 */
export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  console.log('[Fulfillment API] Received request');

  try {
    // Parse request body
    const body = await request.json();
    const { shopifyOrderId, shopDomain, packageId, trackingNumber } = body;

    console.log('[Fulfillment API] Request body:', { shopifyOrderId, shopDomain, packageId, trackingNumber });

    // Validate required fields
    if (!shopifyOrderId || !shopDomain) {
      console.error('[Fulfillment API] Missing required fields');
      return json(
        { error: "Missing required fields: shopifyOrderId, shopDomain" },
        { status: 400 }
      );
    }

    // Get Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error('[Fulfillment API] Missing or invalid Authorization header');
      return json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const apiKey = authHeader.replace("Bearer ", "");
    console.log('[Fulfillment API] API Key received:', apiKey.substring(0, 10) + '...');

    // Verify the API key matches the shop in our database
    const config = await prisma.droppinShopConfig.findUnique({
      where: { shop: shopDomain },
      select: { apiKey: true }
    });

    console.log('[Fulfillment API] Config found:', !!config);

    if (!config || config.apiKey !== apiKey) {
      console.error('[Fulfillment API] Invalid API key for shop:', shopDomain);
      return json({ error: "Invalid API key for shop" }, { status: 403 });
    }

    console.log('[Fulfillment API] Auth successful, fetching session for shop:', shopDomain);

    // Get Shopify session for this shop
    const session = await prisma.session.findFirst({
      where: { 
        shop: shopDomain,
        isOnline: false // Use offline token for background operations
      },
      orderBy: {
        expires: 'desc'
      }
    });

    if (!session || !session.accessToken) {
      console.error(`[Fulfillment API] No valid Shopify session found for shop: ${shopDomain}`);
      return json(
        { error: "No valid Shopify session found for this shop" },
        { status: 404 }
      );
    }

    console.log('[Fulfillment API] Session found, checking expiry');

    // Check if token is expired
    if (session.expires && new Date(session.expires) < new Date()) {
      console.error(`[Fulfillment API] Shopify session expired for shop: ${shopDomain}`);
      return json(
        { error: "Shopify session expired. Please reinstall the app." },
        { status: 401 }
      );
    }

    console.log('[Fulfillment API] Session valid, calling Shopify GraphQL fulfillment flow');

    const orderGid = normalizeOrderGid(shopifyOrderId);
    if (!orderGid) {
      return json({ error: "Invalid Shopify order ID" }, { status: 400 });
    }

    const getFulfillmentOrdersQuery = `#graphql
      query GetFulfillmentOrders($orderId: ID!) {
        order(id: $orderId) {
          id
          displayFulfillmentStatus
          fulfillmentOrders(first: 10) {
            edges {
              node {
                id
                status
              }
            }
          }
        }
      }
    `;

    let orderData;
    try {
      orderData = await shopifyGraphql(
        shopDomain,
        session.accessToken,
        getFulfillmentOrdersQuery,
        { orderId: orderGid }
      );
    } catch (graphErr) {
      const msg = String(graphErr?.message || "");
      const scopeDenied = msg.includes("fulfillmentOrders field") || msg.includes("ACCESS_DENIED");
      if (!scopeDenied) throw graphErr;

      // Fallback for apps that do not yet have fulfillment-order scopes.
      const orderNumericId = extractOrderNumericId(shopifyOrderId);
      if (!orderNumericId) {
        return json({ error: "Invalid Shopify order ID" }, { status: 400 });
      }

      console.warn("[Fulfillment API] GraphQL fulfillment scope missing, trying REST fallback");
      const restRes = await fetch(
        `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/orders/${orderNumericId}/fulfillments.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": session.accessToken,
          },
          body: JSON.stringify({
            fulfillment: {
              notify_customer: true,
              tracking_info: {
                number: trackingNumber || undefined,
                company: "Droppin",
              },
            },
          }),
        }
      );

      const restText = await restRes.text();
      let restPayload = null;
      try {
        restPayload = restText ? JSON.parse(restText) : null;
      } catch {
        restPayload = { raw: restText };
      }
      if (!restRes.ok) {
        return json(
          {
            error: "Failed to fulfill Shopify order",
            details: restPayload,
            status: restRes.status,
            hint: "Add Shopify scopes: read_merchant_managed_fulfillment_orders, write_merchant_managed_fulfillment_orders, then reinstall the app.",
          },
          { status: restRes.status }
        );
      }

      const restFulfillmentId = restPayload?.fulfillment?.id;
      return json({
        success: true,
        message: "Order fulfilled successfully (REST fallback)",
        orderId: orderGid,
        fulfillmentId: restFulfillmentId,
      });
    }

    const order = orderData?.order;
    if (!order) {
      return json({ error: "Shopify order not found" }, { status: 404 });
    }

    const fulfillmentOrderIds = (order.fulfillmentOrders?.edges || [])
      .map((edge) => edge?.node)
      .filter((fo) => fo && fo.status !== "CLOSED")
      .map((fo) => fo.id);

    if (fulfillmentOrderIds.length === 0) {
      console.log(`[Fulfillment API] No open fulfillment orders for ${orderGid}. It may already be fulfilled.`);
      return json({
        success: true,
        message: "Order already fulfilled or no open fulfillment orders",
        orderId: orderGid,
      });
    }

    const fulfillmentCreateMutation = `#graphql
      mutation FulfillmentCreate($fulfillment: FulfillmentInput!, $message: String) {
        fulfillmentCreate(fulfillment: $fulfillment, message: $message) {
          fulfillment {
            id
            status
            trackingInfo {
              number
              company
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const lineItemsByFulfillmentOrder = fulfillmentOrderIds.map((id) => ({ fulfillmentOrderId: id }));
    const trackingInfo = trackingNumber
      ? { number: trackingNumber, company: "Droppin" }
      : { company: "Droppin" };

    const fulfillmentResult = await shopifyGraphql(
      shopDomain,
      session.accessToken,
      fulfillmentCreateMutation,
      {
        fulfillment: {
          notifyCustomer: true,
          trackingInfo,
          lineItemsByFulfillmentOrder,
        },
        message: `Delivered by Droppin${trackingNumber ? ` - Tracking ${trackingNumber}` : ""}`,
      }
    );

    const userErrors = fulfillmentResult?.fulfillmentCreate?.userErrors || [];
    if (userErrors.length > 0) {
      const alreadyFulfilled = userErrors.some((e) =>
        String(e?.message || "").toLowerCase().includes("fulfilled")
      );
      if (alreadyFulfilled) {
        return json({
          success: true,
          message: "Order already fulfilled",
          orderId: orderGid,
        });
      }
      return json(
        { error: "Failed to fulfill Shopify order", details: userErrors },
        { status: 422 }
      );
    }

    const fulfillment = fulfillmentResult?.fulfillmentCreate?.fulfillment;
    console.log(`✓ [Fulfillment API] Successfully fulfilled Shopify order ${orderGid} for package ${packageId}`);
    console.log('[Fulfillment API] Fulfillment data:', fulfillment);

    return json({
      success: true,
      message: "Order fulfilled successfully",
      orderId: orderGid,
      fulfillmentId: fulfillment?.id,
    });

  } catch (error) {
    console.error("[Fulfillment API] Error in fulfillment webhook:", error);
    console.error("[Fulfillment API] Error stack:", error.stack);
    return json(
      { 
        error: "Internal server error",
        message: error.message 
      },
      { status: 500 }
    );
  }
};
