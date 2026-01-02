import { authenticate } from "../shopify.server";

// Handles Shopify OAuth callback and completes session creation
export const loader = async ({ request }) => {
  return authenticate.callback({ request });
};
