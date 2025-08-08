const { Item, Package, Shop } = require('../models');
const { Op } = require('sequelize');

// Create a new item for a package
exports.createItem = async (req, res) => {
  try {
    const { packageId, description, quantity, codAmount } = req.body;

    // Verify that user is a shop
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Only shops can create items' });
    }

    // Get shop ID
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Verify that the package belongs to this shop
    const package = await Package.findOne({ 
      where: { 
        id: packageId,
        shopId: shop.id 
      } 
    });
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found or does not belong to your shop' });
    }

    // Validate input
    if (!description || description.trim() === '') {
      return res.status(400).json({ message: 'Description is required' });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    if (codAmount < 0) {
      return res.status(400).json({ message: 'COD amount cannot be negative' });
    }

    // Create the item
    const item = await Item.create({
      packageId,
      description: description.trim(),
      quantity: parseInt(quantity),
      codAmount: parseFloat(codAmount) || 0
    });

    res.status(201).json({
      message: 'Item created successfully',
      item
    });

  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all items for a package
exports.getItemsByPackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    // Verify that user is a shop
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Only shops can view items' });
    }

    // Get shop ID
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Verify that the package belongs to this shop
    const package = await Package.findOne({ 
      where: { 
        id: packageId,
        shopId: shop.id 
      } 
    });
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found or does not belong to your shop' });
    }

    // Get all items for the package
    const items = await Item.findAll({
      where: { packageId },
      order: [['createdAt', 'ASC']]
    });

    res.json({
      message: 'Items retrieved successfully',
      items
    });

  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, quantity, codAmount } = req.body;

    // Verify that user is a shop
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Only shops can update items' });
    }

    // Get shop ID
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Find the item and verify it belongs to a package from this shop
    const item = await Item.findOne({
      include: [{
        model: Package,
        where: { shopId: shop.id }
      }],
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found or does not belong to your shop' });
    }

    // Validate input
    if (description !== undefined && (!description || description.trim() === '')) {
      return res.status(400).json({ message: 'Description is required' });
    }

    if (quantity !== undefined && (!quantity || quantity <= 0)) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    if (codAmount !== undefined && codAmount < 0) {
      return res.status(400).json({ message: 'COD amount cannot be negative' });
    }

    // Update the item
    const updateData = {};
    if (description !== undefined) updateData.description = description.trim();
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (codAmount !== undefined) updateData.codAmount = parseFloat(codAmount);

    await item.update(updateData);

    res.json({
      message: 'Item updated successfully',
      item
    });

  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify that user is a shop
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Only shops can delete items' });
    }

    // Get shop ID
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Find the item and verify it belongs to a package from this shop
    const item = await Item.findOne({
      include: [{
        model: Package,
        where: { shopId: shop.id }
      }],
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found or does not belong to your shop' });
    }

    // Delete the item
    await item.destroy();

    res.json({
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get a single item
exports.getItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify that user is a shop
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Only shops can view items' });
    }

    // Get shop ID
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Find the item and verify it belongs to a package from this shop
    const item = await Item.findOne({
      include: [{
        model: Package,
        where: { shopId: shop.id }
      }],
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found or does not belong to your shop' });
    }

    res.json({
      message: 'Item retrieved successfully',
      item
    });

  } catch (error) {
    console.error('Error getting item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 