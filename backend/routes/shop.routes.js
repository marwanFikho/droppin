const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const shopController = require('../controllers/shop.controller');

// Public routes
router.post('/register', shopController.registerShop);
router.get('/', shopController.getAllShops);
router.get('/:id', shopController.getShopById);

// Test route to verify the shops API is working
router.get('/test/connection', (req, res) => {
  res.json({ message: 'Shop routes are connected and working!' });
});

// Protected routes - require authentication
router.get('/profile', authenticate, authorize('shop'), shopController.getShopProfile);
router.put('/profile/update', authenticate, authorize('shop'), shopController.updateShopProfile);
router.put('/:id', authenticate, shopController.updateShop);

module.exports = router;
