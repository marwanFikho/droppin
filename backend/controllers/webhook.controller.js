const crypto = require('crypto');

// Shopify API Secret
const SHOPIFY_API_SECRET = '5d3a322b312dc88b66480128ab2f67d4';

/**
 * Verify Shopify HMAC signature
 * @param {string} hmacHeader - The X-Shopify-Hmac-SHA256 header value
 * @param {Buffer|string} body - The raw request body
 * @returns {boolean} - True if HMAC is valid, false otherwise
 */
const verifyShopifyHmac = (hmacHeader, body) => {
  // Ensure body is a string
  const bodyString = typeof body === 'string' ? body : body.toString('utf-8');

  // Create HMAC
  const computed = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(bodyString, 'utf-8')
    .digest('base64');

  // Compare with provided HMAC
  return computed === hmacHeader;
};

/**
 * Webhook handler middleware
 * Verifies HMAC and returns 403 if invalid
 */
const verifyWebhookSignature = (req, res, next) => {
  const hmacHeader = req.get('X-Shopify-Hmac-SHA256');

  if (!hmacHeader) {
    return res.status(403).json({ error: 'request denied' });
  }

  // Get raw body
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!verifyShopifyHmac(hmacHeader, rawBody)) {
    return res.status(403).json({ error: 'request denied' });
  }

  // HMAC is valid, proceed
  next();
};

/**
 * Handle APP_UNINSTALLED webhook
 */
const handleAppUninstalled = (req, res) => {
  res.status(200).json({ success: true });
};

/**
 * Handle APP_SUBSCRIPTIONS_UPDATE webhook
 */
const handleAppSubscriptionsUpdate = (req, res) => {
  res.status(200).json({ success: true });
};

/**
 * Handle CUSTOMERS_DATA_REQUEST webhook
 */
const handleCustomersDataRequest = (req, res) => {
  res.status(200).json({ success: true });
};

/**
 * Handle CUSTOMERS_REDACT webhook
 */
const handleCustomersRedact = (req, res) => {
  res.status(200).json({ success: true });
};

/**
 * Handle SHOP_REDACT webhook
 */
const handleShopRedact = (req, res) => {
  res.status(200).json({ success: true });
};

module.exports = {
  verifyWebhookSignature,
  handleAppUninstalled,
  handleAppSubscriptionsUpdate,
  handleCustomersDataRequest,
  handleCustomersRedact,
  handleShopRedact,
};
