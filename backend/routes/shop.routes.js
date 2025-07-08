const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { Shop, User, Package, MoneyTransaction, sequelize } = require('../models');
const { QueryTypes, Op } = require('sequelize');
const crypto = require('crypto');

// Get shop profile data with financial columns
router.get('/profile', authenticate, authorize('shop'), async (req, res) => {
  try {
    // First, get the shop ID for the current user
    const shop = await Shop.findOne({ 
      where: { userId: req.user.id },
      attributes: ['id']
    });
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Use direct SQL query to get the exact values from the database
    const [rawShopData] = await sequelize.query(
      `SELECT id, userId, businessName, businessType, contactPersonName, contactPersonPhone, 
              contactPersonEmail, address, createdAt, updatedAt, ToCollect, TotalCollected, shippingFees, settelled, shownShippingFees 
       FROM Shops WHERE id = :shopId`,
      {
        replacements: { shopId: shop.id },
        type: QueryTypes.SELECT
      }
    );
    
    console.log('Raw shop data from direct SQL query:', rawShopData);
    
    if (!rawShopData) {
      return res.status(404).json({ message: 'Shop data not found' });
    }
    
    // Get all packages for this shop to calculate missing values if needed
    const packages = await Package.findAll({ 
      where: { shopId: shop.id },
      attributes: ['id', 'codAmount', 'isPaid', 'status'] 
    });
    
    // If TotalCollected is null (legacy rows), calculate it; leave ToCollect as-is to avoid double counting
    if (rawShopData.TotalCollected === null) {
      console.log('Need to calculate financial totals for shop ID:', shop.id);
      
      // Calculate financial totals
      let totalCollected = 0;
      
      packages.forEach(pkg => {
        // Packages with COD that have been paid but not settled
        if (pkg.codAmount > 0 && pkg.isPaid) {
          totalCollected += parseFloat(pkg.codAmount);
        }
      });
      
      console.log('Calculated financial TotalCollected value:', { totalCollected });
      
      // Update the shop with calculated values
      await sequelize.query(
        `UPDATE Shops SET ToCollect = :toCollect, TotalCollected = :totalCollected 
         WHERE id = :shopId`,
        {
          replacements: { 
            shopId: shop.id,
            toCollect: rawShopData.ToCollect || 0,
            totalCollected: totalCollected 
          },
          type: QueryTypes.UPDATE
        }
      );
      
      // Get the updated values
      const [updatedShop] = await sequelize.query(
        `SELECT ToCollect, TotalCollected FROM Shops WHERE id = :shopId`,
        {
          replacements: { shopId: shop.id },
          type: QueryTypes.SELECT
        }
      );
      
      rawShopData.ToCollect = updatedShop.ToCollect;
      rawShopData.TotalCollected = updatedShop.TotalCollected;
      
      console.log('Updated shop financial data:', {
        ToCollect: updatedShop.ToCollect,
        TotalCollected: updatedShop.TotalCollected
      });
    }
    
    // Create a response object with the raw values
    const response = {
      ...rawShopData,
      // Create explicit string versions to ensure precision
      rawToCollect: String(rawShopData.ToCollect || 0),
      rawTotalCollected: String(rawShopData.TotalCollected || 0),
      rawSettelled: String(rawShopData.settelled || 0),
      shippingFees: rawShopData.shippingFees,
      shownShippingFees: rawShopData.shownShippingFees
    };
    
    console.log('Sending shop profile response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching shop profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update shop profile data
router.put('/profile', authenticate, authorize('shop'), async (req, res) => {
  try {
    const userId = req.user.id;
    const shop = await Shop.findOne({ where: { userId } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    const { businessName, contactPerson, address, shownShippingFees } = req.body;
    // Update fields if provided
    if (businessName) shop.businessName = businessName;
    if (contactPerson) {
      shop.contactPersonName = contactPerson.name || shop.contactPersonName;
      shop.contactPersonPhone = contactPerson.phone || shop.contactPersonPhone;
      shop.contactPersonEmail = contactPerson.email || shop.contactPersonEmail;
    }
    if (address) {
      shop.address = address; // Save as a single string
    }
    if (shownShippingFees !== undefined) {
      shop.shownShippingFees = shownShippingFees;
    }
    await shop.save();
    res.json({ message: 'Shop profile updated successfully' });
  } catch (error) {
    console.error('Error updating shop profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get shop's money transactions
router.get('/money-transactions', authenticate, authorize('shop'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      startDate,
      endDate,
      attribute,
      changeType,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search
    } = req.query;

    // First, get the shop ID for the current user
    const shop = await Shop.findOne({ 
      where: { userId: req.user.id },
      attributes: ['id']
    });
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Build where clause
    const where = { shopId: shop.id };
    if (attribute) where.attribute = attribute;
    if (changeType) where.changeType = changeType;
    
    // Add date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    // Add search functionality
    if (search) {
      where[Op.or] = [
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    // Validate sort field
    const validSortFields = ['createdAt', 'amount', 'attribute', 'changeType'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const actualSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { count, rows } = await MoneyTransaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[actualSortBy, actualSortOrder]]
    });

    res.json({
      transactions: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      filters: {
        startDate,
        endDate,
        attribute,
        changeType,
        sortBy: actualSortBy,
        sortOrder: actualSortOrder
      }
    });
  } catch (err) {
    console.error('Error fetching money transactions:', err);
    res.status(500).json({ message: err.message });
  }
});

// Endpoint to get or generate the shop's API key
router.post('/generate-api-key', authenticate, authorize('shop'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    if (!shop.apiKey) {
      // Generate a new API key
      shop.apiKey = crypto.randomBytes(32).toString('hex');
      await shop.save();
    }
    res.json({ apiKey: shop.apiKey });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
