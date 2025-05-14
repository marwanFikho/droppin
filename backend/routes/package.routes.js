const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public tracking route (no authentication required)
router.get('/track/:trackingNumber', packageController.getPackageByTracking);

// Protected routes
router.use(authenticate);

// Shop specific routes
router.get('/shop', authorize('shop'), packageController.getShopPackages);

// User specific routes
router.get('/user', authorize('user'), packageController.getUserPackages);

// Driver specific routes
router.get('/driver', authorize('driver'), packageController.getDriverPackages);
router.patch('/driver/:id/accept', authorize('driver'), packageController.acceptPackage);

// General package routes (with proper authorization)
router.post('/', authorize('shop', 'admin'), packageController.createPackage);
router.get('/', authorize('admin'), packageController.getAllPackages);
router.get('/:id', authorize('shop', 'driver', 'admin', 'user'), packageController.getPackageById);
router.put('/:id', authorize('shop', 'admin'), packageController.updatePackage);
router.delete('/:id', authorize('shop', 'admin'), packageController.deletePackage);
router.patch('/:id/status', authorize('shop', 'driver', 'admin'), packageController.updatePackageStatus);

// Delivery confirmation routes
router.post('/:id/photos', authorize('driver', 'admin'), packageController.addDeliveryPhoto);
router.post('/:id/signature', authorize('driver', 'admin'), packageController.addDeliverySignature);

module.exports = router;
