const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Placeholder route
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'User routes working' });
});

module.exports = router;
