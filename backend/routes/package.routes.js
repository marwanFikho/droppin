const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public tracking route (no authentication required)
router.get('/track/:trackingNumber', packageController.getPackageByTracking);

// Protected routes
router.use(authenticate);

// Routes for shops, drivers, and admins
router.post('/', authorize('shop', 'admin'), packageController.createPackage);
router.get('/', authorize('shop', 'driver', 'admin'), packageController.getPackages);
router.get('/:id', authorize('shop', 'driver', 'admin'), packageController.getPackageById);
router.put('/:id', authorize('shop', 'admin'), packageController.updatePackage);
router.patch('/:id/status', authorize('shop', 'driver', 'admin'), packageController.updatePackageStatus);
router.patch('/:id/payment', authorize('shop', 'driver', 'admin'), packageController.updatePackagePayment);
router.post('/:id/photos', authorize('driver', 'admin'), packageController.addDeliveryPhoto);
router.post('/:id/signature', authorize('driver', 'admin'), packageController.addDeliverySignature);
router.patch('/:id/cancel', authorize('shop'), packageController.cancelPackage);

module.exports = router;
