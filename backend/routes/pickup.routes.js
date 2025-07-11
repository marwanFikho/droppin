const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { Pickup } = require('../models');
const { Package } = require('../models');
const { Shop } = require('../models');
const { logMoneyTransaction } = require('../utils/moneyLogger');
const { createNotification } = require('../controllers/notification.controller');
const { User } = require('../models');

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

    // Associate selected packages with the pickup and update their status
    if (packageIds && packageIds.length > 0) {
      await pickup.addPackages(packageIds);
      await Package.update(
        { 
          status: 'scheduled_for_pickup',
          pickupId: pickup.id
        },
        { where: { id: packageIds } }
      );
    }

    // Notify admin of new pickup
    try {
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      if (adminUser) {
        await createNotification({
          userId: adminUser.id,
          userType: 'admin',
          title: 'New Pickup Scheduled',
          message: `A new pickup (ID: ${pickup.id}) was scheduled by shop ${shop.businessName}.`,
          data: { pickupId: pickup.id, shopId, shopName: shop.businessName }
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify admin of new pickup:', notifyErr);
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

// Get all pickups for admin
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const pickups = await Pickup.findAll({
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Package,
          attributes: ['id', 'trackingNumber', 'packageDescription', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
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

// Get shop pickups
router.get('/shop', authenticate, async (req, res) => {
  try {
    // Find the shop for the current user
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(400).json({ message: 'Shop not found for this user.' });
    }

    const pickups = await Pickup.findAll({
      where: { shopId: shop.id },
      include: [{ model: Package }],
      order: [['createdAt', 'DESC']]
    });

    res.json(pickups);
  } catch (error) {
    console.error('Error fetching shop pickups:', error);
    res.status(500).json({
      message: 'Failed to fetch pickups',
      error: error.message
    });
  }
});

// Get a specific pickup
router.get('/:id', authenticate, async (req, res) => {
  try {
    let shop = null;
    if (req.user.role !== 'admin') {
      // Find the shop for the current user
      shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop) {
        return res.status(400).json({ message: 'Shop not found for this user.' });
      }
    }
    const pickup = await Pickup.findByPk(req.params.id, {
      include: [{ model: Package }]
    });

    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }

    // Check if the user has permission to view this pickup
    if (req.user.role !== 'admin' && pickup.shopId !== shop.id) {
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

// Mark pickup as picked up (admin only)
router.patch('/:id/pickup', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const pickup = await Pickup.findByPk(req.params.id, {
      include: [{ model: Package }]
    });

    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }

    if (pickup.status === 'picked_up') {
      return res.status(400).json({ message: 'Pickup already marked as picked up' });
    }

    // Update pickup status and actual pickup time
    await pickup.update({
      status: 'picked_up',
      actualPickupTime: new Date()
    });

    // Update all packages in this pickup to 'pending' status
    if (pickup.Packages && pickup.Packages.length > 0) {
      const packageIds = pickup.Packages.map(pkg => pkg.id);
      await Package.update(
        { status: 'pending' },
        { where: { id: packageIds } }
      );

      // Notify shop of each package picked up
      try {
        const shop = await Shop.findByPk(pickup.shopId);
        if (shop) {
          const shopUser = await User.findByPk(shop.userId);
          if (shopUser) {
            for (const pkg of pickup.Packages) {
              await createNotification({
                userId: shopUser.id,
                userType: 'shop',
                title: 'Package Picked Up',
                message: `Your package (Tracking: ${pkg.trackingNumber}) has been picked up as part of pickup #${pickup.id}.`,
                data: { packageId: pkg.id, pickupId: pickup.id, shopName: shop.businessName }
              });
            }
          }
        }
      } catch (notifyErr) {
        console.error('Failed to notify shop of package pickup:', notifyErr);
      }

      // ===================== NEW FEATURE =====================
      // Add total COD amount of these packages to the shop's ToCollect field
      // -------------------------------------------------------
      try {
        // Sum COD amounts for the packages in this pickup
        const totalCodAmount = pickup.Packages.reduce((sum, pkg) => {
          const cod = parseFloat(pkg.codAmount || 0);
          return sum + (isNaN(cod) ? 0 : cod);
        }, 0);

        if (totalCodAmount > 0) {
          const shop = await Shop.findByPk(pickup.shopId);
          if (shop) {
            const currentToCollect = parseFloat(shop.ToCollect || 0);
            const newToCollect = currentToCollect + totalCodAmount;
            await shop.update({ ToCollect: newToCollect });
            await logMoneyTransaction(shop.id, totalCodAmount, 'ToCollect', 'increase', `COD added via pickup ${pickup.id}`);
            console.log(`Updated shop (${shop.id}) ToCollect on pickup: ${currentToCollect} -> ${newToCollect}`);
          }
        }
      } catch (codError) {
        console.error('Failed to update shop ToCollect after marking pickup as picked up:', codError);
      }
      // =================== END NEW FEATURE ===================
    }

    res.json({ 
      message: 'Pickup marked as picked up successfully',
      pickup 
    });
  } catch (error) {
    console.error('Error marking pickup as picked up:', error);
    res.status(500).json({ 
      message: 'Failed to mark pickup as picked up', 
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
    // Reset status of all packages in this pickup to 'awaiting_schedule'
    if (pickup.Packages && pickup.Packages.length > 0) {
      const packageIds = pickup.Packages.map(pkg => pkg.id);
      await Package.update(
        { 
          status: 'awaiting_schedule',
          pickupId: null
        },
        { where: { id: packageIds } }
      );
    }
    res.json({ message: 'Pickup cancelled and packages reset', pickup });
  } catch (error) {
    console.error('Error cancelling pickup:', error);
    res.status(500).json({ message: 'Failed to cancel pickup', error: error.message });
  }
});

// Assign a driver to a pickup (admin only)
router.patch('/admin/pickups/:id/assign-driver', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { driverId } = req.body;
    if (!driverId) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }
    const pickup = await Pickup.findByPk(req.params.id);
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    pickup.driverId = driverId;
    await pickup.save();
    res.json({ message: 'Driver assigned to pickup successfully', pickup });
  } catch (error) {
    console.error('Error assigning driver to pickup:', error);
    res.status(500).json({ message: 'Failed to assign driver to pickup', error: error.message });
  }
});

// Update pickup status (admin only)
router.patch('/admin/pickups/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    // Fetch pickup with packages
    const pickup = await Pickup.findByPk(req.params.id, { include: [{ model: Package }] });
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    // If status is being set to picked_up, do COD/ToCollect logic
    if (status === 'picked_up') {
      // Only run if not already picked_up
      if (pickup.status !== 'picked_up') {
        // Update pickup status and actual pickup time
        await pickup.update({ status: 'picked_up', actualPickupTime: new Date() });
        // Update all packages in this pickup to 'pending' status
        if (pickup.Packages && pickup.Packages.length > 0) {
          const packageIds = pickup.Packages.map(pkg => pkg.id);
          await Package.update(
            { status: 'pending' },
            { where: { id: packageIds } }
          );
          // Sum COD amounts for the packages in this pickup
          const totalCodAmount = pickup.Packages.reduce((sum, pkg) => {
            const cod = parseFloat(pkg.codAmount || 0);
            return sum + (isNaN(cod) ? 0 : cod);
          }, 0);
          if (totalCodAmount > 0) {
            const shop = await Shop.findByPk(pickup.shopId);
            if (shop) {
              const currentToCollect = parseFloat(shop.ToCollect || 0);
              const newToCollect = currentToCollect + totalCodAmount;
              await shop.update({ ToCollect: newToCollect });
              await logMoneyTransaction(shop.id, totalCodAmount, 'ToCollect', 'increase', `COD added via pickup ${pickup.id}`);
              console.log(`Updated shop (${shop.id}) ToCollect on pickup: ${currentToCollect} -> ${newToCollect}`);
            }
          }
        }
      }
    } else {
      // For other statuses, just update the status
      await pickup.update({ status });
    }
    res.json({ message: 'Pickup status updated successfully', pickup });
  } catch (error) {
    console.error('Error updating pickup status:', error);
    res.status(500).json({ message: 'Failed to update pickup status', error: error.message });
  }
});

module.exports = router; 