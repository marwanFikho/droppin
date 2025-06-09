const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { Pickup } = require('../models');
const { Package } = require('../models');
const { Shop } = require('../models');

// Create a new pickup
router.post('/', authenticate, async (req, res) => {
  try {
    const { scheduledTime, pickupAddress, packageIds } = req.body;
    // Find the shop for the current user
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(400).json({ message: 'Shop not found for this user.' });
    }
    const shopId = shop.id;

    // Create the pickup
    const pickup = await Pickup.create({
      shopId,
      scheduledTime,
      pickupAddress,
      status: 'scheduled'
    });

    // Associate selected packages with the pickup
    if (packageIds && packageIds.length > 0) {
      await pickup.addPackages(packageIds);
      await Package.update(
        { status: 'scheduled_for_pickup' },
        { where: { id: packageIds } }
      );
    }

    res.status(201).json({
      message: 'Pickup scheduled successfully',
      pickup
    });
  } catch (error) {
    console.error('Error creating pickup:', error);
    res.status(500).json({
      message: 'Failed to schedule pickup',
      error: error.message
    });
  }
});

// Get all pickups for a shop
router.get('/shop', authenticate, async (req, res) => {
  try {
    // Find the shop for the current user
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(400).json({ message: 'Shop not found for this user.' });
    }
    const shopId = shop.id;

    const pickups = await Pickup.findAll({
      where: { shopId },
      order: [['scheduledTime', 'DESC']]
    });

    res.json(pickups);
  } catch (error) {
    console.error('Error fetching pickups:', error);
    res.status(500).json({
      message: 'Failed to fetch pickups',
      error: error.message
    });
  }
});

// Get a specific pickup
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Find the shop for the current user
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(400).json({ message: 'Shop not found for this user.' });
    }
    const pickup = await Pickup.findByPk(req.params.id, {
      include: [{ model: Package }]
    });

    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }

    // Check if the user has permission to view this pickup
    if (pickup.shopId !== shop.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this pickup' });
    }

    res.json(pickup);
  } catch (error) {
    console.error('Error fetching pickup:', error);
    res.status(500).json({
      message: 'Failed to fetch pickup',
      error: error.message
    });
  }
});

// Update pickup status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const pickup = await Pickup.findByPk(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        message: 'Pickup not found'
      });
    }

    // Check if the user has permission to update this pickup
    if (pickup.shopId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Not authorized to update this pickup'
      });
    }

    await pickup.update({ status });
    res.json({
      message: 'Pickup status updated successfully',
      pickup
    });
  } catch (error) {
    console.error('Error updating pickup status:', error);
    res.status(500).json({
      message: 'Failed to update pickup status',
      error: error.message
    });
  }
});

// Cancel a pickup and reset package statuses
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    // Find the shop for the current user
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(400).json({ message: 'Shop not found for this user.' });
    }
    const pickup = await Pickup.findByPk(req.params.id, {
      include: [{ model: Package }]
    });
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    if (pickup.shopId !== shop.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this pickup' });
    }
    // Update pickup status
    await pickup.update({ status: 'cancelled' });
    // Reset status of all packages in this pickup to 'pending'
    if (pickup.Packages && pickup.Packages.length > 0) {
      const packageIds = pickup.Packages.map(pkg => pkg.id);
      await Package.update(
        { status: 'pending' },
        { where: { id: packageIds } }
      );
    }
    res.json({ message: 'Pickup cancelled and packages reset', pickup });
  } catch (error) {
    console.error('Error cancelling pickup:', error);
    res.status(500).json({ message: 'Failed to cancel pickup', error: error.message });
  }
});

module.exports = router; 