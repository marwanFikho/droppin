console.log('apiKeyAuth middleware loaded');
const Shop = require('../models/shop.model');

module.exports = async function apiKeyAuth(req, res, next) {
  console.log('apiKeyAuth middleware called');
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('API key missing or malformed. Received header:', auth);
    return res.status(401).json({ error: 'Missing API key' });
  }
  const apiKey = auth.replace('Bearer ', '').trim();
  console.log('Received API key:', apiKey);
  const shop = await Shop.findOne({ where: { apiKey } });
  if (!shop) {
    console.log('No shop found for API key:', apiKey);
    return res.status(401).json({ error: 'Invalid API key' });
  }
  console.log('Shop found for API key:', shop.id);
  req.shop = shop;
  next();
}; 