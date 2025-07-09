const express = require('express');
const router = express.Router();
const simplifiedController = require('../controllers/simplified.controller');

// Simple info route for testing
router.get('/', simplifiedController.getInfo);
router.post('/', simplifiedController.postDebugLog);

module.exports = router;
