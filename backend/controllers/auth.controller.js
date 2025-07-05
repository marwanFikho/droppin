const jwt = require('jsonwebtoken');
const { User, Shop, Driver } = require('../models/index');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Register a new user
exports.register = async (req, res) => {
  // Log the request body for debugging
  console.log('User Registration Request:', JSON.stringify(req.body, null, 2));
  
  // Start a transaction
  const transaction = await User.sequelize.transaction();
  
  try {
    const { name, email, password, phone, role, address } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ 
      where: { email },
      transaction
    });
    
    if (userExists) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // For regular users, approve automatically
    const isApproved = role === 'user' || role === 'admin';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'user',
      isApproved,
      street: address?.street,
      city: address?.city,
      state: address?.state,
      zipCode: address?.zipCode,
      country: address?.country,
      isActive: true
    }, { transaction });

    // Commit transaction
    await transaction.commit();
    
    // Return success response
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      token: generateToken(user.id),
    });
  } catch (error) {
    // Rollback transaction in case of error
    await transaction.rollback();
    console.error('Registration error:', error);
    
    // Provide more detailed error information
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      // Extract validation error messages
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

// Register a shop
exports.registerShop = async (req, res) => {
  // Log the request body for debugging
  console.log('Shop Registration Request:', JSON.stringify(req.body, null, 2));
  
  // Start a transaction
  const transaction = await User.sequelize.transaction();
  
  try {
    const { 
      email, password, phone,
      businessName, businessType, contactPerson, businessAddress,
      registrationNumber, taxId
    } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ 
      where: { email },
      transaction
    });
    
    if (userExists) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with shop role - shops need approval
    // Use businessName as the name for the user record
    const user = await User.create({
      name: businessName, // Use business name as the primary name
      email,
      password,
      phone, // This is now the business phone
      role: 'shop',
      isApproved: false, // Shops require approval
      street: businessAddress?.street,
      city: businessAddress?.city,
      state: businessAddress?.state,
      zipCode: businessAddress?.zipCode,
      country: businessAddress?.country,
      isActive: true
    }, { transaction });

    // Format the business address as a string
    let addressString = '';
    if (businessAddress) {
      // Format address as "street, city, state zipCode, country"
      addressString = [
        businessAddress.street,
        businessAddress.city && businessAddress.state ? `${businessAddress.city}, ${businessAddress.state}` : (businessAddress.city || businessAddress.state || ''),
        businessAddress.zipCode,
        businessAddress.country
      ].filter(Boolean).join(', ');
    }

    // Create shop profile
    const shop = await Shop.create({
      userId: user.id,
      businessName,
      businessType,
      address: addressString,
      registrationNumber,
      taxId,
      contactPersonName: contactPerson?.name,
      contactPersonPhone: contactPerson?.phone,
      contactPersonEmail: contactPerson?.email,
      isVerified: false
    }, { transaction });

    // Commit the transaction if successful
    await transaction.commit();
    
    // Return success response
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      shopId: shop.id,
      businessName: shop.businessName,
      token: generateToken(user.id),
    });
  } catch (error) {
    // Rollback transaction in case of error
    await transaction.rollback();
    console.error('Shop registration error:', error);
    
    // Provide more detailed error information
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      // Extract validation error messages
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: error.message || 'Shop registration failed' });
  }
};

// Register a driver
exports.registerDriver = async (req, res) => {
  // Log the request body for debugging
  console.log('Driver Registration Request:', JSON.stringify(req.body, null, 2));
  
  // Start a transaction
  const transaction = await User.sequelize.transaction();
  
  try {
    const { 
      name, email, password, phone, address,
      vehicleType, vehicleDetails, licenseNumber, idNumber
    } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ 
      where: { email }, 
      transaction 
    });
    
    if (userExists) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with driver role
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'driver',
      isApproved: false, // Drivers require approval
      street: address?.street,
      city: address?.city,
      state: address?.state,
      zipCode: address?.zipCode,
      country: address?.country,
      isActive: true
    }, { transaction });

    // Create driver profile
    const driver = await Driver.create({
      userId: user.id,
      vehicleType,
      licensePlate: vehicleDetails?.licensePlate,
      model: vehicleDetails?.model, 
      color: vehicleDetails?.color,
      driverLicense: licenseNumber,
      isAvailable: true
    }, { transaction });

    // Commit transaction if successful
    await transaction.commit();
    
    // Return success response
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      driverId: driver.id,
      vehicleType: driver.vehicleType,
      token: generateToken(user.id),
    });
  } catch (error) {
    // Rollback transaction in case of error
    await transaction.rollback();
    console.error('Driver registration error:', error);
    
    // Provide more detailed error information
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      // Extract validation error messages
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: error.message || 'Driver registration failed' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, hasPassword: !!password });

    // Find user by email
    const user = await User.findOne({ where: { email } });
    console.log('User lookup result:', user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isActive: user.isActive
    } : 'No user found');

    if (!user) {
      console.log('No user found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('Account is inactive:', user.id);
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    // Check if shop/driver is approved
    if ((user.role === 'shop' || user.role === 'driver') && !user.isApproved) {
      console.log('Account pending approval:', user.id);
      return res.status(403).json({ message: 'Your account is pending approval. Please wait for an administrator to approve your account.' });
    }

    // Always use secure password comparison
    console.log('Comparing password for user:', user.id);
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', user.id);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get additional profile data based on role
    let profileData = {};
    
    if (user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: user.id } });
      if (shop) {
        profileData = {
          shopId: shop.id,
          businessName: shop.businessName,
        };
      }
    } else if (user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: user.id } });
      if (driver) {
        profileData = {
          driverId: driver.id,
          vehicleType: driver.vehicleType,
          isAvailable: driver.isAvailable,
        };
      }
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      ...profileData,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create a user object with correct address format
    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      isActive: user.isActive,
      lang: user.lang,
      address: {
        street: user.street,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    let profileData = {};
    
    if (user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: user.id } });
      if (shop) {
        profileData = { 
          shop: {
            id: shop.id,
            businessName: shop.businessName,
            businessType: shop.businessType,
            address: shop.address,
            registrationNumber: shop.registrationNumber,
            taxId: shop.taxId,
            createdAt: shop.createdAt,
            updatedAt: shop.updatedAt
          }
        };
      }
    } else if (user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: user.id } });
      if (driver) {
        profileData = { 
          driver: {
            id: driver.id,
            vehicleType: driver.vehicleType,
            licensePlate: driver.licensePlate,
            model: driver.model,
            driverLicense: driver.driverLicense,
            isAvailable: driver.isAvailable,
            createdAt: driver.createdAt,
            updatedAt: driver.updatedAt
          }
        };
      }
    }
    
    res.json({
      user: userObj,
      ...profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Change password for authenticated user
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    // Optionally: validate new password strength here
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password.' });
  }
};
