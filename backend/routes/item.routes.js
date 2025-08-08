const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new item for a package
router.post('/', authorize(['shop']), itemController.createItem);

// Get all items for a specific package
router.get('/package/:packageId', authorize(['shop']), itemController.getItemsByPackage);

// Get a specific item
router.get('/:id', authorize(['shop']), itemController.getItem);

// Update an item
router.put('/:id', authorize(['shop']), itemController.updateItem);

// Delete an item
router.delete('/:id', authorize(['shop']), itemController.deleteItem);

module.exports = router; 