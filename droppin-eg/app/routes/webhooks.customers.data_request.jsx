import { authenticate } from "../shopify.server";
import db from "../db.server";
import GDPRLogger from "../utils/gdprLogger";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  
  // Extract customer ID from the webhook payload
  const customerId = payload.customer?.id;
  
  if (customerId) {
    try {
      // Get customer data from your database
      const customerData = await db.session.findMany({
        where: { 
          shop: shop,
          // Add any customer-specific data you store
        }
      });

      // Format the response according to GDPR requirements
      const gdprData = {
        customer: {
          id: customerId,
          email: customerData.find(s => s.email)?.email || null,
          first_name: customerData.find(s => s.firstName)?.firstName || null,
          last_name: customerData.find(s => s.lastName)?.lastName || null,
          phone: null, // Add if you store phone numbers
          orders_count: 0, // Add if you track order counts
          total_spent: 0, // Add if you track spending
          created_at: customerData[0]?.createdAt || null,
          updated_at: customerData[0]?.updatedAt || null,
        },
        orders: [], // Add order data if you store it
        addresses: [], // Add address data if you store it
        // Add any other customer data you collect
      };

      // Log the data request for audit purposes
      await GDPRLogger.logDataRequest(shop, customerId, 'data_request', gdprData);
      
      // In a real implementation, you might want to:
      // 1. Send this data to Shopify via their API
      // 2. Store the request for audit purposes
      // 3. Notify the shop owner about the data request
      
    } catch (error) {
      console.error(`Error processing GDPR data request for customer ${customerId}:`, error);
    }
  }

  return new Response();
}; 