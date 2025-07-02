const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { Driver, User } = require('../models');

// Placeholder route
router.get('/', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Driver routes working' });
});

// Get current driver's profile and stats with user details
router.get('/profile', authenticate, authorize('driver', 'admin'), async (req, res) => {
  try {
    // Find the driver by userId with user details
    const driver = await Driver.findOne({ 
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          attributes: ['name', 'email', 'phone', 'isApproved', 'createdAt', 'lang']
        }
      ]
    });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch driver profile', error: error.message });
  }
});

// Admin endpoint to update driver's working area
router.patch('/:driverId/working-area', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { driverId } = req.params;
    const { workingArea } = req.body;
    
    if (!workingArea) {
      return res.status(400).json({ message: 'Working area is required' });
    }
    
    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    await driver.update({ workingArea });
    
    res.json({ 
      message: 'Driver working area updated successfully',
      driver: {
        id: driver.id,
        workingArea: driver.workingArea
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update driver working area', error: error.message });
  }
});

// PATCH /drivers/availability - driver toggles their own availability
router.patch('/availability', authenticate, authorize('driver'), async (req, res) => {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'isAvailable must be a boolean' });
    }
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    driver.isAvailable = isAvailable;
    await driver.save();
    res.json({ message: 'Availability updated', isAvailable: driver.isAvailable });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update availability', error: error.message });
  }
});

module.exports = router;
