# Shopify Order Fulfillment Integration

## Overview
When a package is marked as **delivered** or **delivered-returned** in the Droppin backend, the system automatically marks the corresponding Shopify order as fulfilled in the shop's Shopify store.

## How It Works

### Architecture
1. **Backend (Droppin)** → Sends fulfillment webhook to **Shopify App (droppin-eg)**
2. **Shopify App** → Calls Shopify Admin API to mark order as fulfilled

### Flow
```
Package Status Update (delivered/delivered-returned)
            ↓
    Backend checks if package has shopifyOrderId
            ↓
    Backend sends POST to ${SHOPIFY_APP_URL}/api/fulfillment
            ↓
    Shopify App validates API key
            ↓
    Shopify App calls Shopify Admin API
            ↓
    Order marked as fulfilled in Shopify
```

## Setup Instructions

### 1. Backend Configuration

#### Add Shop Domain
When creating or updating a shop that uses Shopify integration, set the `shopDomain` field:

```javascript
// Example: When creating a shop via Shopify app
shop.shopDomain = "your-shop.myshopify.com"; // e.g., droppin-testing.myshopify.com
```

#### Environment Variables
In `backend/.env`, set the Shopify app URL:

```bash
# Production
SHOPIFY_APP_URL=https://shopify.droppin-eg.com

# Local Testing (use your .trycloudflare.com URL from `shopify app dev`)
SHOPIFY_APP_URL=https://abc123.trycloudflare.com
```

#### Run Migration
Run the database migration to add the `shopDomain` column to the Shops table:

```bash
cd backend
npm run migrate
```

### 2. Shopify App Configuration

The fulfillment endpoint is automatically available at:
```
POST /api/fulfillment
```

**Authentication:** Bearer token (shop's Droppin API key)

**Request Body:**
```json
{
  "shopifyOrderId": "gid://shopify/Order/123456789",
  "shopDomain": "your-shop.myshopify.com",
  "packageId": 123,
  "trackingNumber": "DRP-123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order fulfilled successfully",
  "orderId": "gid://shopify/Order/123456789",
  "fulfillmentId": "987654321"
}
```

### 3. Workflow Integration

#### When Creating Packages from Shopify Orders
Ensure the package includes:
- `shopifyOrderId` - The Shopify order ID
- `shopId` - Must reference a shop with `shopDomain` set

#### Status Updates
The fulfillment happens automatically when:
- Admin/Driver changes status to `delivered`
- Admin changes status to `delivered-returned` (final status after partial delivery)

**Note:** Partial deliveries (`delivered-awaiting-return`) do NOT trigger fulfillment until the final status.

## Testing

### Local Testing
1. Start backend: `cd backend && npm run dev`
2. Start Shopify app: `cd droppin-eg && shopify app dev`
3. Copy the .trycloudflare.com URL and update backend/.env:
   ```bash
   SHOPIFY_APP_URL=https://your-tunnel.trycloudflare.com
   ```
4. Create a test order in Shopify
5. Send it to Droppin
6. Mark the package as delivered
7. Check Shopify to confirm the order is fulfilled

### Production
1. Ensure `backend/.env` has:
   ```bash
   SHOPIFY_APP_URL=https://shopify.droppin-eg.com
   ```
2. Ensure shops have `shopDomain` set correctly
3. Monitor logs for fulfillment success/failure

## Troubleshooting

### "No valid Shopify session found"
- The shop needs to install/reinstall the Shopify app
- Check that the shop domain in the database matches exactly

### "Invalid API key"
- Ensure the shop's `apiKey` in Droppin backend matches `DroppinShopConfig.apiKey` in the Shopify app database

### "Shopify session expired"
- Shop needs to reinstall the app to get a new access token

### "Order already fulfilled"
- This is normal if the package status was changed multiple times
- The endpoint handles this gracefully and returns success

## Database Schema

### Backend (Droppin) - Shops Table
```sql
ALTER TABLE Shops ADD COLUMN shopDomain VARCHAR(255) NULL
  COMMENT 'Shopify shop domain (e.g., droppin-testing.myshopify.com)';
```

### Shopify App - DroppinShopConfig Table
```prisma
model DroppinShopConfig {
  id     String @id @default(cuid())
  shop   String @unique  // Shopify domain
  apiKey String          // Droppin backend API key
}
```

## Security

- **Authentication:** API key verification prevents unauthorized fulfillment requests
- **Shop Validation:** Only shops with matching domain and API key can trigger fulfillments
- **Session Validation:** Expired Shopify sessions are rejected
- **Error Handling:** Failed fulfillments don't break the status update flow

## Statuses That Trigger Fulfillment

✅ **Triggers Fulfillment:**
- `delivered`
- `delivered-returned`

❌ **Does NOT Trigger Fulfillment:**
- `delivered-awaiting-return` (partial delivery - waiting for final status)
- Any other status (pending, assigned, pickedup, etc.)

## Future Enhancements

- [ ] Support partial fulfillments based on `deliveredItems`
- [ ] Add tracking URL to Shopify fulfillment
- [ ] Webhook retry mechanism for failed fulfillments
- [ ] Admin UI to manually trigger fulfillment
- [ ] Fulfillment status sync from Shopify back to Droppin
