console.log('=== package.routes.js loaded ===');
const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { Package, Item } = require('../models');
const { formatDateTimeToDDMMYYYY, getCairoDateTime } = require('../utils/dateUtils');

// Public tracking route (no authentication required)
router.get('/track/:trackingNumber', packageController.getPackageByTracking);

// Shopify integration: create packages via API key
router.post('/shopify', apiKeyAuth, async (req, res) => {
  console.log('Received POST /api/packages/shopify');
  try {
    const { packages } = req.body;
    console.log('Received package payload:', JSON.stringify(packages, null, 2));
    if (!Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({ message: 'No packages provided' });
    }

    // Helper to generate tracking number
    function generateTrackingNumber() {
      const prefix = 'DP';
      const timestamp = Math.floor(Date.now() / 1000).toString(16);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}${timestamp}${random}`.toUpperCase();
    }

    const createdPackages = [];
    if (packages.length === 1) {
      // Single package, use create
      const pkg = packages[0];
      const trackingNumber = pkg.trackingNumber || generateTrackingNumber();
      const newPackage = await Package.create({
        shopId: req.shop.id,
        trackingNumber,
        packageDescription: pkg.packageDescription,
        weight: pkg.weight,
        dimensions: pkg.dimensions || null,
        status: 'awaiting_schedule',
        pickupContactName: pkg.pickupContactName || req.shop.contactPersonName,
        pickupContactPhone: pkg.pickupContactPhone || req.shop.contactPersonPhone,
        pickupAddress: pkg.pickupAddress || req.shop.address,
        deliveryContactName: pkg.deliveryContactName,
        deliveryContactPhone: pkg.deliveryContactPhone,
        deliveryAddress: pkg.deliveryAddress,
        schedulePickupTime: pkg.schedulePickupTime || formatDateTimeToDDMMYYYY(getCairoDateTime()),
        priority: pkg.priority || 'normal',
        codAmount: pkg.codAmount || 0,
        deliveryCost: req.shop.shippingFees != null ? parseFloat(req.shop.shippingFees) : (parseFloat(pkg.deliveryCost) || 0),
        shownDeliveryCost: req.shop.shownShippingFees != null ? parseFloat(req.shop.shownShippingFees) : null,
        paymentMethod: pkg.paymentMethod || null,
        paymentNotes: pkg.paymentNotes || null,
        shopNotes: pkg.shopNotes || null,
        // Number of items
        itemsNo: Number.isInteger(pkg.itemsNo) ? pkg.itemsNo : (Array.isArray(pkg.items) ? pkg.items.length : null),
        isPaid: false,
        paymentStatus: 'pending',
        shopifyOrderId: pkg.shopifyOrderId // Only set shopifyOrderId, not isShopifySent
      });

      // Create items if provided
      if (pkg.items && Array.isArray(pkg.items) && pkg.items.length > 0) {
        const itemsToCreate = pkg.items.map(item => ({
          packageId: newPackage.id,
          description: item.description,
          quantity: parseInt(item.quantity) || 1,
          codAmount: parseFloat(item.codAmount) || 0
        }));

        await Item.bulkCreate(itemsToCreate);
        console.log(`Created ${itemsToCreate.length} items for Shopify package ${newPackage.id}`);
      }

      createdPackages.push(newPackage);
    } else {
      // Multiple packages, use bulkCreate with individualHooks
      const pkgsToCreate = packages.map(pkg => ({
        shopId: req.shop.id,
        trackingNumber: pkg.trackingNumber || generateTrackingNumber(),
        packageDescription: pkg.packageDescription,
        weight: pkg.weight,
        dimensions: pkg.dimensions || null,
        status: 'awaiting_schedule',
        pickupContactName: pkg.pickupContactName || req.shop.contactPersonName,
        pickupContactPhone: pkg.pickupContactPhone || req.shop.contactPersonPhone,
        pickupAddress: pkg.pickupAddress || req.shop.address,
        deliveryContactName: pkg.deliveryContactName,
        deliveryContactPhone: pkg.deliveryContactPhone,
        deliveryAddress: pkg.deliveryAddress,
        schedulePickupTime: pkg.schedulePickupTime || formatDateTimeToDDMMYYYY(getCairoDateTime()),
        priority: pkg.priority || 'normal',
        codAmount: pkg.codAmount || 0,
        deliveryCost: req.shop.shippingFees != null ? parseFloat(req.shop.shippingFees) : (parseFloat(pkg.deliveryCost) || 0),
        shownDeliveryCost: req.shop.shownShippingFees != null ? parseFloat(req.shop.shownShippingFees) : null,
        paymentMethod: pkg.paymentMethod || null,
        paymentNotes: pkg.paymentNotes || null,
        shopNotes: pkg.shopNotes || null,
        // Number of items
        itemsNo: Number.isInteger(pkg.itemsNo) ? pkg.itemsNo : (Array.isArray(pkg.items) ? pkg.items.length : null),
        isPaid: false,
        paymentStatus: 'pending',
        shopifyOrderId: pkg.shopifyOrderId // Only set shopifyOrderId, not isShopifySent
      }));
      const newPackages = await Package.bulkCreate(pkgsToCreate, { individualHooks: true });
      
      // Create items for each package if provided
      for (let i = 0; i < newPackages.length; i++) {
        const pkg = packages[i];
        if (pkg.items && Array.isArray(pkg.items) && pkg.items.length > 0) {
          const itemsToCreate = pkg.items.map(item => ({
            packageId: newPackages[i].id,
            description: item.description,
            quantity: parseInt(item.quantity) || 1,
            codAmount: parseFloat(item.codAmount) || 0
          }));

          await Item.bulkCreate(itemsToCreate);
          console.log(`Created ${itemsToCreate.length} items for Shopify package ${newPackages[i].id}`);
        }
      }
      
      createdPackages.push(...newPackages);
    }

    res.status(201).json({ success: true, createdPackages });
  } catch (error) {
    console.error('Error creating packages from Shopify:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all Shopify Order IDs that are already sent for the current shop
router.get('/shopify/sent-ids', apiKeyAuth, async (req, res) => {
  try {
    const sent = await Package.findAll({
      where: { shopId: req.shop.id },
      attributes: ['shopifyOrderId'],
      raw: true
    });
    // Filter out null/empty IDs
    res.json({ sent: sent.map(pkg => pkg.shopifyOrderId).filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected routes (JWT auth)
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
router.patch('/:id/notes', authorize('driver', 'shop', 'admin'), packageController.updatePackageNotes);
// New: shop requests a return on a delivered package
router.post('/:id/request-return', authorize('shop'), packageController.requestReturn);

module.exports = router;
