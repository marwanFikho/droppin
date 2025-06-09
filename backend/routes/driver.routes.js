const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { Driver } = require('../models');

// Placeholder route
router.get('/', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Driver routes working' });
});

// Get current driver's profile and stats
router.get('/profile', authenticate, authorize('driver', 'admin'), async (req, res) => {
  try {
    // Find the driver by userId
    const driver = await Driver.findOne({ where: { userId: req.user.id } });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch driver profile', error: error.message });
  }
});

module.exports = router;
