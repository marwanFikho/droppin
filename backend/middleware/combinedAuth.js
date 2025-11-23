// Combined authentication middleware supporting either Droppin JWT or Shop API key.
// If Authorization bearer token matches a shop.apiKey it promotes that shop's user as req.user with role 'shop'.
// Otherwise falls back to normal JWT authentication.
// This enables Shopify embedded app to call ALL existing endpoints using only the API key.
const Shop = require('../models/shop.model');
const { User } = require('../models');
const { authenticate } = require('./auth.middleware');

module.exports = async function combinedAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      // Try API key path first
      try {
        const shop = await Shop.findOne({ where: { apiKey: token } });
        if (shop) {
          const user = await User.findByPk(shop.userId, { attributes: { exclude: ['password'] } });
          if (!user) {
            return res.status(401).json({ message: 'Invalid shop user for API key' });
          }
            // Ensure user has proper role and is active
          if (user.role !== 'shop') {
            return res.status(403).json({ message: 'API key does not belong to a shop user' });
          }
          if (!user.isActive) {
            return res.status(403).json({ message: 'Shop user account inactive' });
          }
          // Attach shop + user
          req.shop = shop;
          req.user = user;
          req.isApiKeyAuth = true;
          return next();
        }
      } catch (e) {
        console.error('API key lookup failed:', e.message);
        // continue to JWT path
      }
    }
    // Fallback to standard JWT auth
    return authenticate(req, res, next);
  } catch (err) {
    console.error('Combined auth fatal error:', err.message);
    return res.status(500).json({ message: 'Authentication error' });
  }
};
