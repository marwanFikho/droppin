const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Placeholder route
router.get('/', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Driver routes working' });
});

module.exports = router;
