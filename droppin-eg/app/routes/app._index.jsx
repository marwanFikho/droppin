import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  DataTable,
  Banner,
  Checkbox,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { Link as RemixLink } from "@remix-run/react";
import { apiKeyStore } from "../utils/apiKeyStore";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  // Fetch orders from Shopify using GraphQL
  const response = await admin.graphql(`#graphql
    query {
      orders(first: 10, reverse: true) {
        edges {
          node {
            id
            name
            totalPriceSet { shopMoney { amount } }
            totalWeight
            shippingAddress {
              name
              address1
              city
              province
              zip
              country
              phone
            }
            billingAddress {
              phone
            }
            customer {
              phone
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalUnitPriceSet { shopMoney { amount } }
                }
              }
            }
          }
        }
      }
    }
  `);
  const data = await response.json();
  // For demo: add random deliveryFee and delivered status
  const orders = data.data.orders.edges.map(({ node }) => {
    const shipping = node.shippingAddress || {};
    const billing = node.billingAddress || {};
    const customer = node.customer || {};
    const items = node.lineItems.edges.map(e => ({
      title: e.node.title,
      quantity: e.node.quantity,
      price: Number(e.node.originalUnitPriceSet.shopMoney.amount)
    }));
    const itemsString = items.map(item => `${item.quantity}x ${item.title}`).join(", ");
    const weight = (node.totalWeight || 0) / 1000; // grams to kg
    // DEMO: random delivery fee between 20 and 60, and random delivered status
    const deliveryFee = Math.floor(Math.random() * 41) + 20;
    const delivered = Math.random() > 0.5;
    return {
      id: node.id,
      name: node.name,
      customer: shipping.name || "",
      address: shipping.address1 || "",
      city: shipping.city || "",
      province: shipping.province || "",
      zip: shipping.zip || "",
      country: shipping.country || "",
      items,
      itemsString,
      weight,
      phone: shipping.phone || billing.phone || customer.phone || "",
      total: Number(node.totalPriceSet.shopMoney.amount),
      deliveryFee,
      delivered,
    };
  });
  const apiKey = apiKeyStore.key;
  return { orders, apiKey };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );
  const { orders, apiKey } = useLoaderData();
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState(null);
  const [sentOrders, setSentOrders] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem("sentOrders") : null;
    return saved ? JSON.parse(saved) : [];
  });
  const [shopNotes, setShopNotes] = useState({});
  const [noteDialogOrderId, setNoteDialogOrderId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [sentFilter, setSentFilter] = useState('all'); // 'all', 'sent', 'not_sent'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [expandedItems, setExpandedItems] = useState({});

  // Pagination logic
  const filteredOrders = orders.filter(o => {
    if (sentFilter === 'sent') return sentOrders.includes(o.id);
    if (sentFilter === 'not_sent') return !sentOrders.includes(o.id);
    return true;
  });
  const totalPages = Math.ceil(filteredOrders.length / limit);
  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit);

  // Calculate revenue for delivered packages
  const revenue = orders.filter(o => o.delivered).reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const handleCheckbox = (orderId) => {
    setSelected((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleShip = async () => {
    setSending(true);
    setBanner(null);
    // Check for API key
    if (!apiKey) {
      setBanner({ status: "critical", content: "No API key has been set." });
      setSending(false);
      return;
    }
    // Prepare selected orders
    const selectedOrders = orders.filter((o) => selected.includes(o.id));
    // Map to Droppin package fields
    const packages = selectedOrders.map((o) => ({
      shopifyOrderId: o.id, // Add the Shopify order ID
      packageDescription: "coming from Shopify",
      items: o.items.map(item => ({ description: item.title, quantity: item.quantity, codAmount: item.price })),
      itemsNo: o.items.length,
      weight: o.weight,
      deliveryAddress: [o.address, o.city, o.province, o.zip, o.country].filter(Boolean).join(', '),
      deliveryContactName: o.customer,
      deliveryContactPhone: o.phone,
      schedulePickupTime: "ASAP",
      codAmount: o.total,
      shopNotes: shopNotes[o.id] || "",
    }));
    try {
      const res = await fetch("https://api.droppin-eg.com/api/packages/shopify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ packages }),
      });
      if (res.ok) {
        setBanner({ status: "success", content: "Successfully sent orders to Droppin." });
        setSelected([]);
        // Mark these orders as sent
        const newSent = Array.from(new Set([...sentOrders, ...selected]));
        setSentOrders(newSent);
        if (typeof window !== 'undefined') localStorage.setItem("sentOrders", JSON.stringify(newSent));
      } else {
        setBanner({ status: "critical", content: "Error sending packages to Droppin." });
      }
    } catch (e) {
      setBanner({ status: "critical", content: "Error sending packages to Droppin." });
    }
    setSending(false);
  };

  // Add syncSentOrders function
  const syncSentOrders = async () => {
    setBanner({ status: "info", content: "Syncing sent orders..." });
    try {
      const res = await fetch("https://api.droppin-eg.com/api/packages/shopify/sent-ids", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "ngrok-skip-browser-warning": "true",
        }
      });
      if (!res.ok) throw new Error("Failed to fetch sent orders");
      const data = await res.json();
      setSentOrders(data.sent);
      if (typeof window !== 'undefined') localStorage.setItem("sentOrders", JSON.stringify(data.sent));
      setBanner({ status: "success", content: "Sync complete!" });
    } catch (e) {
      setBanner({ status: "critical", content: "Error syncing sent orders." });
    }
  };

  return (
    <Page>
      <TitleBar title="Droppin EG">
        <RemixLink to="/app/settings">
          <Button>Droppin Settings</Button>
        </RemixLink>
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </TitleBar>
      {/* Add Droppin Website button styles */}
      <style>{`
        .droppin-orders-container {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.07);
          padding: 32px 28px 24px 28px;
          max-width: 1200px;
          margin: 32px auto 0 auto;
        }
        .droppin-orders-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 16px;
          font-family: 'Inter', 'Montserrat', Arial, sans-serif;
          font-size: 15px;
        }
        .droppin-orders-table th, .droppin-orders-table td {
          border-bottom: 1px solid #f0f0f0;
          padding: 12px 10px;
          text-align: left;
          vertical-align: top;
        }
        .droppin-orders-table th {
          background: #fafbfc;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .droppin-orders-table tr:last-child td {
          border-bottom: none;
        }
        .droppin-orders-table tbody tr:hover {
          background: #f6f8fa;
        }
        .droppin-item-card {
          transition: all 0.2s ease;
        }
        .droppin-item-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .droppin-toggle-btn {
          transition: color 0.2s ease;
        }
        .droppin-toggle-btn:hover {
          color: #0056b3 !important;
        }
        .droppin-filter-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #fafbfc;
          border-radius: 8px;
          padding: 10px 16px;
          margin-bottom: 12px;
          border: 1px solid #f0f0f0;
        }
        .droppin-pagination {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          background: #fafbfc;
          border-radius: 8px;
          padding: 8px 16px;
          border: 1px solid #f0f0f0;
          width: fit-content;
        }
        .droppin-pagination button {
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 4px 10px;
          cursor: pointer;
          transition: background 0.15s, border 0.15s;
        }
        .droppin-pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .droppin-pagination select {
          margin-left: 8px;
          border-radius: 6px;
          border: 1px solid #ccc;
          padding: 4px 8px;
        }
        @media (max-width: 900px) {
          .droppin-orders-container {
            padding: 12px 4px;
            max-width: 100vw;
          }
          .droppin-orders-table th, .droppin-orders-table td {
            padding: 8px 4px;
            font-size: 13px;
          }
          .droppin-item-card {
            padding: 3px 6px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
      <div className="droppin-orders-container">
        {banner && (
          <Banner 
            status={banner.status} 
            onDismiss={() => setBanner(null)}
          >
            {banner.content}
          </Banner>
        )}
        {/* Sync Button */}
        <div style={{ marginBottom: 16 }}>
          <Button onClick={syncSentOrders} variant="primary">Sync Sent Orders</Button>
        </div>
        {/* Filter Dropdown */}
        <div className="droppin-filter-bar">
          <label style={{ marginRight: 8 }}>Filter:</label>
          <select
            value={sentFilter}
            onChange={e => { setSentFilter(e.target.value); setPage(1); }}
            style={{ padding: 4 }}
          >
            <option value="all">All</option>
            <option value="sent">Sent</option>
            <option value="not_sent">Not Sent</option>
          </select>
        </div>
        {/* Orders Table */}
        <table className="droppin-orders-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Shop Note</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Checkbox
                    checked={selected.includes(o.id)}
                    onChange={() => handleCheckbox(o.id)}
                    disabled={sentOrders.includes(o.id)}
                  />
                </td>
                <td>{o.name}</td>
                <td>{o.customer}</td>
                <td>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px',
                    maxWidth: '200px'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#6c757d',
                      fontWeight: '500',
                      marginBottom: '2px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                      <button
                        className="droppin-toggle-btn"
                        onClick={() => setExpandedItems(prev => ({ ...prev, [o.id]: !prev[o.id] }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#007bff',
                          fontSize: '10px',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {expandedItems[o.id] ? 'Hide items' : 'Show items'}
                      </button>
                    </div>
                    {expandedItems[o.id] && (
                      <div>
                        {o.items.map((item, index) => (
                          <div key={index} className="droppin-item-card" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 8px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            fontSize: '13px',
                            border: '1px solid #e9ecef'
                          }}>
                            <span 
                              title={item.title}
                              style={{ 
                                fontWeight: '500',
                                color: '#495057',
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.title}
                            </span>
                            <span style={{
                              backgroundColor: '#007bff',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              minWidth: '20px',
                              textAlign: 'center'
                            }}>
                              {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>${o.total}</td>
                <td>
                  {sentOrders.includes(o.id) ? (
                    <span style={{ color: 'green', fontWeight: 600 }}>Sent</span>
                  ) : (
                    <span style={{ color: 'red', fontWeight: 600 }}>Not Sent</span>
                  )}
                </td>
                <td>
                  <Button
                    size="slim"
                    onClick={() => {
                      setNoteDialogOrderId(o.id);
                      setNoteDraft(shopNotes[o.id] || "");
                    }}
                    disabled={sentOrders.includes(o.id)}
                  >
                    Shop Note
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Shop Note Dialog */}
        {noteDialogOrderId && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 400
            }}>
              <h3>Add Shop Note</h3>
              <textarea
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                rows={4}
                style={{ width: '100%' }}
              />
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={() => setNoteDialogOrderId(null)}>Cancel</Button>
                <Button
                  primary
                  onClick={() => {
                    setShopNotes({ ...shopNotes, [noteDialogOrderId]: noteDraft });
                    setNoteDialogOrderId(null);
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Pagination/Limiter */}
        <div className="droppin-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lt;</button>
          <span>Page {page} of {totalPages || 1}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>&gt;</button>
          <span style={{ marginLeft: 16 }}>Show</span>
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
            <option value={15}>15 / page</option>
            <option value={30}>30 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
        {/* Ship with Droppin Button */}
        <div style={{ marginTop: 16 }}>
          <Button
            primary
            disabled={selected.length === 0 || sending}
            loading={sending}
            onClick={handleShip}
          >
            Ship with Droppin
          </Button>
        </div>
        
        {/* Footer Links */}
        <div style={{ 
          marginTop: 32, 
          paddingTop: 16, 
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
          fontSize: '14px',
          color: '#666'
        }}>
          <Link url="/privacy" target="_blank">Privacy Policy</Link>
          {' | '}
          <Link url="/terms" target="_blank">Terms of Service</Link>
        </div>
      </div>
    </Page>
  );
}