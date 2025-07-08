import { authenticate } from "../shopify.server";
import db from "../db.server";
import GDPRLogger from "../utils/gdprLogger";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  
  try {
    // Delete all shop data from your database
    // This includes sessions, orders, settings, and any other shop-specific data
    
    // Delete all sessions for this shop
    await db.session.deleteMany({
      where: { shop: shop }
    });

    // If you have other tables with shop data, delete from those too
    // Example:
    // await db.shopSettings.deleteMany({ where: { shop } });
    // await db.shopOrders.deleteMany({ where: { shop } });
    // await db.shopCustomers.deleteMany({ where: { shop } });
    // await db.shopProducts.deleteMany({ where: { shop } });

    // Log the deletion for audit purposes
    await GDPRLogger.logShopDeletion(shop, { deletedAt: new Date().toISOString() });
    
    // In a real implementation, you might want to:
    // 1. Store a record of the deletion for audit purposes
    // 2. Ensure all related data is properly anonymized or deleted
    // 3. Clean up any external service data associated with this shop
    // 4. Remove any API keys or credentials stored for this shop
    
  } catch (error) {
    console.error(`Error processing GDPR shop deletion for shop ${shop}:`, error);
  }

  return new Response();
}; 