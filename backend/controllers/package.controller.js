const { sequelize, Package, Shop, User } = require('../models/index');
const { v4: uuidv4 } = require('uuid');

// Generate a unique tracking number
const generateTrackingNumber = () => {
  // Format: DP-XXXX-XXXX-XXXX (DP for Dropin)
  const uuid = uuidv4().replace(/-/g, '').toUpperCase();
  return `DP-${uuid.substr(0, 4)}-${uuid.substr(4, 4)}-${uuid.substr(8, 4)}`;
};

// Create a new package
exports.createPackage = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      packageDescription,
      weight,
      dimensions,
      pickupContactName,
      pickupContactPhone,
      pickupAddress,
      deliveryContactName,
      deliveryContactPhone,
      deliveryAddress,
      recipientUserId, // Optional: link to an existing user account
      notes
    } = req.body;
    
    console.log('Create Package Request:', req.body);

    // Verify that user is a shop
    if (req.user.role !== 'shop') {
      await transaction.rollback();
      return res.status(403).json({ message: 'Only shops can create packages' });
    }
    
    // Find the shop associated with this user
    const shop = await Shop.findOne({
      where: { userId: req.user.id },
      transaction
    });
    
    if (!shop) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Shop not found for this user' });
    }
    
    console.log(`Found shop ID: ${shop.id} for user ID: ${req.user.id}`);
    
    // Validate required fields
    if (!packageDescription) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Package description is required' });
    }
    
    if (!weight) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Package weight is required' });
    }
    
    if (!deliveryContactName || !deliveryContactPhone || !deliveryAddress) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Delivery contact and address information are required' });
    }
    
    // Create a new package with pickup and delivery information
    const trackingNumber = generateTrackingNumber();
    
    const newPackage = await Package.create({
      trackingNumber,
      packageDescription,
      weight,
      dimensions: typeof dimensions === 'string' ? dimensions : JSON.stringify(dimensions),
      status: 'pending',
      shopId: shop.id,
      userId: recipientUserId || null,  // Link to recipient user if provided
      driverId: null,  // Will be assigned later
      
      // Pickup information
      pickupContactName: pickupContactName || shop.contactName,
      pickupContactPhone: pickupContactPhone || shop.contactPhoneNumber,
      pickupAddress: pickupAddress || shop.address,
      
      // Delivery information
      deliveryContactName,
      deliveryContactPhone,
      deliveryAddress
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      message: 'Package created successfully',
      package: {
        id: newPackage.id,
        trackingNumber: newPackage.trackingNumber,
        status: newPackage.status,
        packageDescription: newPackage.packageDescription,
        createdAt: newPackage.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all packages (admin only)
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Shop,
          attributes: ['businessName', 'contactName']
        },
        {
          model: User,
          attributes: ['name', 'email']
        }
      ]
    });
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching all packages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all packages with filters and pagination
exports.getPackages = async (req, res) => {
  try {
    const { 
      status, priority, search, fromDate, toDate, 
      page = 1, limit = 10, sort = '-createdAt' 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Apply user role-based filters
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop profile not found' });
      }
      filter.shopId = shop.id;
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }
      filter.driverId = driver._id;
    } else if (req.user.role === 'user') {
      // Regular users can't access packages, they should use tracking number
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Priority filter
    if (priority) {
      filter.priority = priority;
    }
    
    // Date range filter
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    
    // Search by tracking number or description
    if (search) {
      filter.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { packageDescription: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.contactName': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Count total documents that match the filter
    const total = await Package.countDocuments(filter);
    
    // Execute the query with pagination
    const packages = await Package.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('shopId', 'businessName')
      .populate('driverId', 'userId')
      .exec();
    
    // Return the paginated result
    res.json({
      packages,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get package by ID
exports.getPackageById = async (req, res) => {
  try {
    const package = await Package.findById(req.params.id)
      .populate('shopId', 'businessName businessAddress contactPerson')
      .populate({
        path: 'driverId',
        select: 'userId vehicleType vehicleDetails',
        populate: {
          path: 'userId',
          select: 'name phone email'
        }
      })
      .populate('statusHistory.updatedBy', 'name role');
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ userId: req.user._id });
      if (!shop || !package.shopId.equals(shop._id)) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ userId: req.user._id });
      if (!driver || (package.driverId && !package.driverId.equals(driver._id))) {
        // Drivers can see assigned packages or unassigned packages
        if (package.driverId) {
          return res.status(403).json({ message: 'Unauthorized access' });
        }
      }
    }
    
    res.json(package);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get packages for the authenticated shop
exports.getShopPackages = async (req, res) => {
  try {
    // Find the shop associated with this user
    const shop = await Shop.findOne({
      where: { userId: req.user.id }
    });
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }
    
    // Get packages for this shop
    const packages = await Package.findAll({
      where: { shopId: shop.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching shop packages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get packages for the authenticated driver
exports.getDriverPackages = async (req, res) => {
  try {
    // Find the driver associated with this user
    const driver = await sequelize.query(
      'SELECT * FROM Drivers WHERE userId = ?',
      {
        replacements: [req.user.id],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!driver || driver.length === 0) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Get packages assigned to this driver
    const packages = await Package.findAll({
      where: { driverId: driver[0].id },
      order: [['createdAt', 'DESC']]
    });
    
    // Also get packages that are available for pickup
    const availablePackages = await Package.findAll({
      where: {
        driverId: null,
        status: 'pending'
      },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      assigned: packages,
      available: availablePackages
    });
  } catch (error) {
    console.error('Error fetching driver packages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get packages for the authenticated user
exports.getUserPackages = async (req, res) => {
  try {
    // Get packages for this user
    const packages = await Package.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching user packages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get package by tracking number (public)
exports.getPackageByTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const package = await Package.findOne({ trackingNumber })
      .select('trackingNumber status statusHistory packageDescription schedulePickupTime estimatedDeliveryTime actualPickupTime actualDeliveryTime priority createdAt')
      .populate('shopId', 'businessName');
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json(package);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept a package by a driver
exports.acceptPackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the package
    const package = await Package.findByPk(id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check if package is already assigned
    if (package.driverId) {
      return res.status(400).json({ message: 'Package already assigned to a driver' });
    }
    
    // Find the driver associated with this user
    const driver = await sequelize.query(
      'SELECT * FROM Drivers WHERE userId = ?',
      {
        replacements: [req.user.id],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!driver || driver.length === 0) {
      return res.status(404).json({ message: 'Driver profile not found' });
    }
    
    // Update package status and assign to driver
    await package.update({
      driverId: driver[0].id,
      status: 'assigned'
    });
    
    res.json({
      message: 'Package accepted successfully',
      package
    });
  } catch (error) {
    console.error('Error accepting package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update package status
exports.updatePackageStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Invalid package status' });
    }
    
    // Find the package
    const packageToUpdate = await Package.findByPk(id, { transaction });
    
    if (!packageToUpdate) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check permissions based on role
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({
        where: { userId: req.user.id },
        transaction
      });
      
      if (!shop || packageToUpdate.shopId !== shop.id) {
        await transaction.rollback();
        return res.status(403).json({ message: 'You do not have permission to update this package' });
      }
      
      // Shops can only cancel packages that are still pending
      if (status !== 'cancelled' && packageToUpdate.status !== 'pending') {
        await transaction.rollback();
        return res.status(403).json({ message: 'Shops can only cancel pending packages' });
      }
    } else if (req.user.role === 'driver') {
      // Add driver permission logic here
    } else if (req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ message: 'Unauthorized to update package status' });
    }
    
    // Update package status
    await packageToUpdate.update({ 
      status,
      ...(status === 'pickedup' ? { pickupDate: new Date() } : {}),
      ...(status === 'delivered' ? { deliveredAt: new Date() } : {})
    }, { transaction });
    
    await transaction.commit();
    
    res.json({
      message: 'Package status updated successfully',
      package: {
        id: packageToUpdate.id,
        status: packageToUpdate.status,
        trackingNumber: packageToUpdate.trackingNumber
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating package status:', error);
    res.status(500).json({ message: error.message || 'Failed to update package status' });
  }
};

// Delete a package
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the package
    const package = await Package.findByPk(id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      // Find the shop associated with this user
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      
      if (!shop || package.shopId !== shop.id) {
        return res.status(403).json({ message: 'You are not authorized to delete this package' });
      }
      
      // Can only delete pending packages
      if (package.status !== 'pending') {
        return res.status(400).json({ message: 'Can only delete packages with pending status' });
      }
    }
    
    // Delete the package
    await package.destroy();
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update package details
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Fields that can be updated
    const allowedUpdates = [
      'packageDescription', 'weight', 'dimensions', 
      'pickupAddress', 'deliveryAddress', 'schedulePickupTime',
      'priority', 'notes', 'deliveryFee',
      'pickupContactName', 'pickupContactPhone',
      'deliveryContactName', 'deliveryContactPhone'
    ];
    
    // Filter out fields that are not allowed to be updated
    const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});
    
    // Convert dimensions to string if it's an object
    if (filteredUpdateData.dimensions && typeof filteredUpdateData.dimensions === 'object') {
      filteredUpdateData.dimensions = JSON.stringify(filteredUpdateData.dimensions);
    }
    
    // Find package
    const package = await Package.findByPk(id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ 
        where: { userId: req.user.id }
      });
      
      if (!shop || package.shopId !== shop.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      // Shops can only update packages with pending status
      if (package.status !== 'pending') {
        return res.status(403).json({ message: 'Can only update packages with pending status' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Update package
    await package.update(filteredUpdateData);
    
    // Fetch the updated package to return
    const updatedPackage = await Package.findByPk(id);
    
    res.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add delivery photo
exports.addDeliveryPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;
    
    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }
    
    // Find package
    const package = await Package.findByPk(id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization (only drivers or admins can add photos)
    if (req.user.role === 'driver') {
      const driver = await sequelize.query(
        'SELECT * FROM Drivers WHERE userId = ?',
        {
          replacements: [req.user.id],
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (!driver || driver.length === 0 || package.driverId !== driver[0].id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Add photo to deliveryPhotos JSON field or create it if it doesn't exist
    let photos = [];
    if (package.deliveryPhotos) {
      try {
        photos = JSON.parse(package.deliveryPhotos);
      } catch (e) {
        photos = [];
      }
    }
    
    photos.push({
      url: photoUrl,
      timestamp: new Date()
    });
    
    // Update the package
    await package.update({
      deliveryPhotos: JSON.stringify(photos)
    });
    
    res.json(package);
  } catch (error) {
    console.error('Error adding delivery photo:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add delivery signature
exports.addDeliverySignature = async (req, res) => {
  try {
    const { id } = req.params;
    const { signatureData } = req.body;
    
    if (!signatureData) {
      return res.status(400).json({ message: 'Signature data is required' });
    }
    
    // Find package
    const package = await Package.findByPk(id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization (only drivers or admins can add signature)
    if (req.user.role === 'driver') {
      const driver = await sequelize.query(
        'SELECT * FROM Drivers WHERE userId = ?',
        {
          replacements: [req.user.id],
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (!driver || driver.length === 0 || package.driverId !== driver[0].id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Add signature as JSON
    const signature = {
      data: signatureData,
      timestamp: new Date()
    };
    
    // Update the package
    await package.update({
      signature: JSON.stringify(signature)
    });
    
    res.json(package);
  } catch (error) {
    console.error('Error adding delivery signature:', error);
    res.status(500).json({ message: error.message });
  }
};
