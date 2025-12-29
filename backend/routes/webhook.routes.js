const express = require('express');
const router = express.Router();
const {
  verifyWebhookSignature,
  handleAppUninstalled,
  handleAppSubscriptionsUpdate,
  handleCustomersDataRequest,
  handleCustomersRedact,
  handleShopRedact,
} = require('../controllers/webhook.controller');

// For webhooks, we need the raw body (Buffer) for HMAC verification
router.use(express.raw({ type: 'application/json' }));

// Apply HMAC verification middleware to all webhook routes
router.use(verifyWebhookSignature);

// APP_UNINSTALLED webhook
router.post('/app/uninstalled', handleAppUninstalled);

// APP_SUBSCRIPTIONS_UPDATE webhook
router.post('/app/scopes_update', handleAppSubscriptionsUpdate);

// CUSTOMERS_DATA_REQUEST webhook (GDPR)
router.post('/customers/data_request', handleCustomersDataRequest);

// CUSTOMERS_REDACT webhook (GDPR)
router.post('/customers/redact', handleCustomersRedact);

// SHOP_REDACT webhook (GDPR)
router.post('/shop/redact', handleShopRedact);

module.exports = router;
