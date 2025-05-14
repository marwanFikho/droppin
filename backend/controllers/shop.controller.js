const { sequelize, Shop, User } = require('../models/index');
const jwt = require('jsonwebtoken');

// Register a shop with a user account
exports.registerShop = async (req, res) => {
  // Log request for debugging
  console.log('Shop Registration Request:', JSON.stringify(req.body, null, 2));
  
  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const {
      businessName,
      businessType,
      address,
      contactName,
      contactEmail,
      contactPhoneNumber,
      registrationNumber,
      taxId,
      username,
      password
    } = req.body;
    
    // Log extracted data for debugging
    console.log('Extracted registration data:', {
      businessName,
      businessType,
      contactEmail,
      contactName,
      username,
      // Don't log password
      hasPassword: !!password
    });
    
    // Validate required fields
    if (!businessName) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Business name is required' });
    }
    
    if (!contactEmail) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Contact email is required' });
    }
    
    if (!username) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Username is required' });
    }
    
    if (!password) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Format address if it's an object (defensive code)
    let formattedAddress = address;
    if (typeof address === 'object' && address !== null) {
      console.log('Address is an object, formatting to string');
      formattedAddress = [
        address.street,
        address.city && address.state ? `${address.city}, ${address.state}` : (address.city || address.state || ''),
        address.zipCode,
        address.country
      ].filter(Boolean).join(', ');
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ 
      where: { email: contactEmail },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ message: 'A user with this email already exists' });
    }
    
    // Check if a shop with this contact email already exists
    const existingShop = await Shop.findOne({
      where: { contactEmail },
      transaction
    });

    if (existingShop) {
      await transaction.rollback();
      return res.status(400).json({ message: 'A shop with this contact email already exists' });
    }
    
    // Create user account first
    const user = await User.create({
      name: contactName,
      email: contactEmail,
      password: password,
      phone: contactPhoneNumber || '0000000000', // Provide default if missing
      role: 'shop',
      isApproved: false,
      isActive: true
    }, { transaction });
    
    console.log('User created successfully with ID:', user.id);

    // Create shop with reference to the user
    const shop = await Shop.create({
      userId: user.id,
      businessName,
      businessType,
      address: formattedAddress,
      contactName,
      contactEmail,
      contactPhoneNumber,
      registrationNumber,
      taxId,
      isVerified: false // Needs admin approval
    }, { transaction });



    await transaction.commit();

    // Generate JWT token for the shop user
    const token = jwt.sign(
      { id: user.id, role: 'shop', shopId: shop.id },
      process.env.JWT_SECRET || 'dropin-secret-key',
      { expiresIn: '24h' }
    );

    // Return shop data and token
    res.status(201).json({
      message: 'Shop registered successfully. Waiting for admin approval.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      shop: {
        id: shop.id,
        businessName: shop.businessName,
        contactName: shop.contactName,
        contactEmail: shop.contactEmail,
        isVerified: shop.isVerified
      },
      token
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Shop registration error:', error);
    
    // Enhanced debugging - log SQL error details if present
    if (error.parent) {
      console.error('SQL Error:', error.parent);
      console.error('SQL Error Code:', error.parent.code);
      console.error('SQL Error Message:', error.parent.message);
    }
    
    // Provide more detailed error information
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      // Extract validation error messages
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Log the complete error for debugging
    console.error('Complete error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    res.status(500).json({ message: error.message || 'Shop registration failed' });
  }
};

// Get all shops (public endpoint)
exports.getAllShops = async (req, res) => {
  try {
    // Only return verified shops for public display
    const shops = await Shop.findAll({
      where: { isVerified: true },
      attributes: ['id', 'businessName', 'businessType', 'address', 'contactName', 'contactPhoneNumber', 'contactEmail']
    });

    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get shop by ID
exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.params.id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.json(shop);
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get shop profile for authenticated shop user
exports.getShopProfile = async (req, res) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;
    const userRole = req.user.role;
    console.log(`Getting shop profile for user ID: ${userId}, role: ${userRole}`);
    
    // Verify user role is 'shop'
    if (userRole !== 'shop') {
      console.log(`User ID ${userId} has role ${userRole}, not 'shop'`);
      return res.status(403).json({ 
        message: 'Access denied. User is not registered as a shop owner.',
        userRole: userRole,
        userId: userId
      });
    }
    
    // Find the shop associated with this user
    const shop = await Shop.findOne({
      where: { userId },
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });

    console.log('Shop query result:', shop ? 'Found' : 'Not Found');
    
    if (!shop) {
      console.log('No shop profile found for user ID:', userId);
      
      // Check if a Shop record exists at all (for debugging)
      const shopCount = await Shop.count();
      console.log(`Total shop records in database: ${shopCount}`);
      
      return res.status(404).json({ 
        message: 'Shop profile not found for this user',
        userId: userId,
        fix: 'Please create a shop profile for this user or contact support.'
      });
    }

    // Return full shop details
    console.log('Sending shop profile:', shop.businessName);
    res.json(shop);
  } catch (error) {
    console.error('Error fetching shop profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update shop profile for the authenticated shop user
exports.updateShopProfile = async (req, res) => {
  try {
    // Get user ID from the authenticated user
    const userId = req.user.id;
    
    // Find the shop associated with this user
    const shop = await Shop.findOne({
      where: { userId }
    });

    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found for this user' });
    }
    
    // Format address if it's an object (defensive code)
    let formattedAddress = req.body.address;
    if (typeof req.body.address === 'object' && req.body.address !== null) {
      console.log('Address is an object, formatting to string');
      formattedAddress = [
        req.body.address.street,
        req.body.address.city && req.body.address.state ? `${req.body.address.city}, ${req.body.address.state}` : (req.body.address.city || req.body.address.state || ''),
        req.body.address.zipCode,
        req.body.address.country
      ].filter(Boolean).join(', ');
    }
    
    // Update the shop data
    const updatedShop = await shop.update({
      ...req.body,
      address: formattedAddress
    });

    res.json({
      message: 'Shop profile updated successfully',
      shop: {
        id: updatedShop.id,
        businessName: updatedShop.businessName,
        contactName: updatedShop.contactName,
        contactEmail: updatedShop.contactEmail,
        address: updatedShop.address
      }
    });
  } catch (error) {
    console.error('Error updating shop profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update shop information
exports.updateShop = async (req, res) => {
  try {
    const shop = await Shop.findByPk(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if the shop contact email is being changed to one that already exists
    if (req.body.contactEmail && req.body.contactEmail !== shop.contactEmail) {
      const existingShop = await Shop.findOne({
        where: { contactEmail: req.body.contactEmail }
      });

      if (existingShop) {
        return res.status(400).json({ message: 'A shop with this contact email already exists' });
      }
    }

    // Update shop with provided fields
    await shop.update(req.body);

    res.json({
      message: 'Shop updated successfully',
      shop: {
        id: shop.id,
        businessName: shop.businessName,
        contactName: shop.contactName,
        contactEmail: shop.contactEmail,
        isVerified: shop.isVerified
      }
    });
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({ message: error.message });
  }
};
