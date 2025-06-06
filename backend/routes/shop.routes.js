const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { Shop, User, Package, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

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
              contactPersonEmail, createdAt, updatedAt, ToCollect, TotalCollected 
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
    
    // If ToCollect or TotalCollected aren't set in the database, calculate them
    if (rawShopData.ToCollect === null || rawShopData.TotalCollected === null) {
      console.log('Need to calculate financial totals for shop ID:', shop.id);
      
      // Calculate financial totals
      let totalToCollect = 0;
      let totalCollected = 0;
      
      packages.forEach(pkg => {
        // Packages with COD amount that are not delivered yet
        if (pkg.codAmount > 0 && !pkg.isPaid) {
          totalToCollect += parseFloat(pkg.codAmount);
        }
        
        // Packages with COD that have been paid but not settled
        if (pkg.codAmount > 0 && pkg.isPaid) {
          totalCollected += parseFloat(pkg.codAmount);
        }
      });
      
      console.log('Calculated financial values:', { totalToCollect, totalCollected });
      
      // Update the shop with calculated values
      await sequelize.query(
        `UPDATE Shops SET ToCollect = :toCollect, TotalCollected = :totalCollected 
         WHERE id = :shopId`,
        {
          replacements: { 
            shopId: shop.id,
            toCollect: totalToCollect,
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
      rawTotalCollected: String(rawShopData.TotalCollected || 0)
    };
    
    console.log('Sending shop profile response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching shop profile:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
