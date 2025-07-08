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
      // Delete all customer data from your database
      // This includes any customer-specific records, orders, addresses, etc.
      
      // Delete customer-related session data (if any)
      await db.session.deleteMany({
        where: { 
          shop: shop,
          // Add any customer-specific conditions
          // For example: customerId: customerId
        }
      });

      // If you have other tables with customer data, delete from those too
      // Example:
      // await db.customerOrders.deleteMany({ where: { customerId } });
      // await db.customerAddresses.deleteMany({ where: { customerId } });
      // await db.customerPreferences.deleteMany({ where: { customerId } });

      // Log the deletion for audit purposes
      await GDPRLogger.logDataRequest(shop, customerId, 'redact', { deletedAt: new Date().toISOString() });
      
      // In a real implementation, you might want to:
      // 1. Store a record of the deletion for audit purposes
      // 2. Notify the shop owner about the data deletion
      // 3. Ensure all related data is properly anonymized or deleted
      
    } catch (error) {
      console.error(`Error processing GDPR customer deletion for customer ${customerId}:`, error);
    }
  }

  return new Response();
}; 