// Legacy standalone API key auth kept for specific endpoints (e.g. bulk Shopify creation)
// Preferred usage for full access is now combinedAuth.js
console.log('apiKeyAuth middleware loaded');
const Shop = require('../models/shop.model');
const { User } = require('../models');

module.exports = async function apiKeyAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  const apiKey = auth.replace('Bearer ', '').trim();
  const shop = await Shop.findOne({ where: { apiKey } });
  if (!shop) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  // Attach shop only (no user). Bulk routes can rely on shop context.
  req.shop = shop;
  // Optional: attach user if exists & active; silently ignore failures.
  try {
    const user = await User.findByPk(shop.userId, { attributes: { exclude: ['password'] } });
    if (user && user.role === 'shop' && user.isActive) {
      req.user = user;
    }
  } catch {}
  next();
};
