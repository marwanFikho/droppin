const { Package, Shop, Driver, User } = require('../models');
const { Op } = require('sequelize');

// Create a new package
exports.createPackage = async (req, res) => {
  try {
    const {
      packageDescription,
      weight,
      dimensions,
      pickupAddress,
      deliveryAddress,
      schedulePickupTime,
      priority,
      // Financial fields
      codAmount
    } = req.body;

    // Verify that user is a shop
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Only shops can create packages' });
    }

    // Get shop ID
    const shop = await Shop.findOne({ where: { userId: req.user.id } });
    if (!shop) {
      return res.status(404).json({ message: 'Shop profile not found' });
    }

    // Generate tracking number
    const prefix = 'DP'; // Droppin prefix
    const timestamp = Math.floor(Date.now() / 1000).toString(16); // Unix timestamp in hex
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const trackingNumber = `${prefix}${timestamp}${random}`.toUpperCase();

    // Format the dimensions as a string if provided (e.g. '10x20x30')
    let dimensionsStr = null;
    if (dimensions && dimensions.length && dimensions.width && dimensions.height) {
      dimensionsStr = `${dimensions.length}x${dimensions.width}x${dimensions.height}`;
    }

    // Create package with proper handling of COD amount and contact information
    const package = await Package.create({
      shopId: shop.id,
      userId: req.user.id,
      trackingNumber,
      packageDescription,
      weight,
      dimensions: dimensionsStr, // Store as string (e.g., '10x20x30')
      status: 'pending',
      // Pickup information
      pickupContactName: pickupAddress?.contactName || req.user.name,
      pickupContactPhone: pickupAddress?.contactPhone || req.user.phone,
      pickupAddress: pickupAddress ? `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zipCode}, ${pickupAddress.country}` : null,
      // Delivery information
      deliveryContactName: deliveryAddress.contactName,
      deliveryContactPhone: deliveryAddress.contactPhone,
      deliveryAddress: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}, ${deliveryAddress.country}`,
      schedulePickupTime: new Date(schedulePickupTime),
      priority: priority || 'normal',
      // Financial information - COD amount and payment status
      codAmount: parseFloat(codAmount) || 0,
      isPaid: false,
      paymentStatus: 'pending'
    });
    
    console.log(`Created package with ID ${package.id}, tracking number ${trackingNumber}`);
    if (codAmount && parseFloat(codAmount) > 0) {
      console.log(`Package has COD amount of ${codAmount}`);
    }

    // Update the shop's ToCollect amount when package is created with COD
    if (package.codAmount > 0) {
      console.log(`Adding COD amount ${package.codAmount} to shop's ToCollect when creating package ${package.id}`);
      
      const currentToCollect = parseFloat(shop.ToCollect || 0);
      const newToCollect = currentToCollect + parseFloat(package.codAmount);
      
      await shop.update({
        ToCollect: newToCollect
      });
      
      console.log(`Updated shop (${shop.id}) ToCollect: ${currentToCollect} -> ${newToCollect}`);
    }

    res.status(201).json(package);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all packages with filters and pagination
exports.getPackages = async (req, res) => {
  try {
    const { 
      status, priority, search, fromDate, toDate, 
      page = 1, limit = 10, sort = 'createdAt' 
    } = req.query;
    
    // Build filter object
    const where = {};
    
    // Apply user role-based filters
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop) {
        return res.status(404).json({ message: 'Shop profile not found' });
      }
      where.shopId = shop.id;
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }
      // Drivers can only see packages assigned to them
      where.driverId = driver.id;
    } else if (req.user.role === 'user') {
      // Regular users can only see packages where their phone number matches the recipient
      where.deliveryContactPhone = req.user.phone;
    } else if (req.user.role !== 'admin') {
      // Any other role without specific permissions
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Status filter
    if (status) {
      where.status = status;
    }
    
    // Priority filter
    if (priority) {
      where.priority = priority;
    }
    
    // Date range filter
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) where.createdAt[Op.lte] = new Date(toDate);
    }
    
    // Search by tracking number or description
    if (search) {
      where[Op.or] = [
        { trackingNumber: { [Op.like]: `%${search}%` } },
        { packageDescription: { [Op.like]: `%${search}%` } },
        { deliveryContactName: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Set up pagination
    const offset = (page - 1) * limit;
    const order = [[sort, 'DESC']];
    
    // Execute the query with pagination - explicitly specify only columns that exist in the database
    const { count, rows: packages } = await Package.findAndCountAll({
      attributes: [
        'id', 'trackingNumber', 'packageDescription', 'weight', 'dimensions',
        'status', 'shopId', 'userId', 'driverId',
        'pickupContactName', 'pickupContactPhone', 'pickupAddress',
        'deliveryContactName', 'deliveryContactPhone', 'deliveryAddress',
        'schedulePickupTime', 'estimatedDeliveryTime',
        'actualPickupTime', 'actualDeliveryTime',
        'priority', 'paymentStatus', 'createdAt', 'updatedAt',
        'codAmount', 'isPaid', 'paymentDate'
      ],
      where,
      limit: parseInt(limit),
      offset,
      order,
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Driver,
          attributes: ['id']
        }
      ]
    });
    
    // Return the paginated result
    res.json({
      packages,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get package by ID
exports.getPackageById = async (req, res) => {
  try {
    const package = await Package.findByPk(req.params.id, {
      attributes: [
        'id', 'trackingNumber', 'packageDescription', 'weight', 'dimensions',
        'status', 'shopId', 'userId', 'driverId',
        'pickupContactName', 'pickupContactPhone', 'pickupAddress',
        'deliveryContactName', 'deliveryContactPhone', 'deliveryAddress',
        'schedulePickupTime', 'estimatedDeliveryTime',
        'actualPickupTime', 'actualDeliveryTime',
        'priority', 'paymentStatus', 'createdAt', 'updatedAt',
        'codAmount', 'isPaid', 'paymentDate'
      ],
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Driver,
          attributes: ['id', 'vehicleType', 'model', 'color', 'driverLicense'],
          include: [
            {
              model: User,
              attributes: ['name', 'email', 'phone']
            }
          ]
        },
        {
          model: User,
          attributes: ['name', 'email', 'phone']
        }
      ]
    });
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop || package.shopId !== shop.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver || (package.driverId && package.driverId !== driver.id)) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    res.json(package);
  } catch (error) {
    console.error('Error fetching package by ID:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get package by tracking number (public)
exports.getPackageByTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const package = await Package.findOne({
      where: { trackingNumber },
      attributes: [
        'id', 'trackingNumber', 'status', 'statusHistory', 
        'packageDescription', 'createdAt', 'deliveryAddress',
        'deliveryContactName', 'estimatedDeliveryTime'
      ]
    });
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Public endpoint - return limited data
    res.json(package);
  } catch (error) {
    console.error('Error tracking package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update package status
exports.updatePackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find package
    const package = await Package.findByPk(id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop || package.shopId !== shop.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      // Shops can only cancel packages with pending status
      if (status !== 'cancelled' || package.status !== 'pending') {
        return res.status(403).json({ message: 'Shops can only cancel pending packages' });
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver) {
        return res.status(404).json({ message: 'Driver profile not found' });
      }
      
      // Drivers can only update packages assigned to them
      if (!package.driverId || package.driverId !== driver.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      // Validate status transition for driver
      const driverAllowedTransitions = {
        'assigned': ['pickedup', 'cancelled'],
        'pickedup': ['in-transit', 'delivered', 'cancelled'],
        'in-transit': ['delivered', 'cancelled']
      };
      
      if (!driverAllowedTransitions[package.status] || !driverAllowedTransitions[package.status].includes(status)) {
        return res.status(400).json({ message: 'Invalid status transition' });
      }
    }
    
    // Update fields - status history has been removed from the schema
    const updateData = {
      status
    };
    
    // Log status change for debugging
    console.log(`Updating package ${id} status from ${package.status} to ${status} by ${req.user.id} (${req.user.role})`);
    if (note) {
      console.log(`Status change note: ${note}`);
    }
    
    // Update timestamps for specific statuses
    if (status === 'pickedup') {
      updateData.actualPickupTime = new Date();
    } else if (status === 'delivered') {
      updateData.actualDeliveryTime = new Date();
      
      // Auto-mark payment as paid when package is delivered if there's a COD amount
      if (package.codAmount > 0 && !package.isPaid) {
        updateData.isPaid = true;
        updateData.paymentDate = new Date();
        
        // Log payment status change
        console.log(`Auto-marking payment as paid for package ${id} with COD amount ${package.codAmount}`);
      }
    }
    
    // Save the original status and payment status values before updating
    const originalStatus = package.status;
    const originalIsPaid = package.isPaid;
    
    // Apply package updates
    await package.update(updateData);
    
    // Get the shop for this package to update financial data
    const shop = await Shop.findByPk(package.shopId, { raw: false });
    
    if (shop) {
      // When a package is marked as delivered and payment collected (isPaid changed)
      if (status === 'delivered' && !originalIsPaid && updateData.isPaid === true && package.codAmount > 0) {
        console.log(`Package ${id} marked as delivered with payment collected. Updating shop financial data.`);
        
        // Move amount from ToCollect to TotalCollected
        const codAmount = parseFloat(package.codAmount || 0);
        const currentToCollect = parseFloat(shop.ToCollect || 0);
        const currentTotalCollected = parseFloat(shop.TotalCollected || 0);
        
        // Calculate new amounts
        const newToCollect = Math.max(0, currentToCollect - codAmount);
        const newTotalCollected = currentTotalCollected + codAmount;
        
        console.log(`Shop financial update: ToCollect ${currentToCollect} -> ${newToCollect}, TotalCollected ${currentTotalCollected} -> ${newTotalCollected}`);
        
        // Update shop
        await shop.update({
          ToCollect: newToCollect,
          TotalCollected: newTotalCollected
        });
      }
      // When a package is initially created or assigned, add to ToCollect
      else if ((originalStatus === 'pending' || !originalStatus) && status === 'assigned' && package.codAmount > 0) {
        console.log(`Package ${id} assigned. Adding to shop's ToCollect.`);
        
        const codAmount = parseFloat(package.codAmount || 0);
        const currentToCollect = parseFloat(shop.ToCollect || 0);
        
        // Update the shop's ToCollect column in the database
        await shop.update({
          ToCollect: currentToCollect + codAmount
        });
        
        console.log(`Updated shop (${shop.id}) ToCollect in database: ${currentToCollect} -> ${currentToCollect + codAmount}`);
      }
    }
    
    // Get updated package with associations
    const updatedPackage = await Package.findByPk(id, {
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Driver,
          attributes: ['id']
        }
      ]
    });
    
    res.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package status:', error);
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
      'priority', 'notes', 'deliveryFee'
    ];
    
    // Filter out fields that are not allowed to be updated
    const filteredUpdateData = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});
    
    // Find package
    const package = await Package.findByPk(id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
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
    
    // Format dimensions if provided
    if (updateData.dimensions) {
      const { length, width, height } = updateData.dimensions;
      if (length && width && height) {
        filteredUpdateData.dimensions = `${length}x${width}x${height}`;
      }
    }
    
    // Format addresses if provided
    if (updateData.pickupAddress) {
      const pa = updateData.pickupAddress;
      filteredUpdateData.pickupAddress = `${pa.street}, ${pa.city}, ${pa.state} ${pa.zipCode}, ${pa.country}`;
      filteredUpdateData.pickupContactName = pa.contactName;
      filteredUpdateData.pickupContactPhone = pa.contactPhone;
    }
    
    if (updateData.deliveryAddress) {
      const da = updateData.deliveryAddress;
      filteredUpdateData.deliveryAddress = `${da.street}, ${da.city}, ${da.state} ${da.zipCode}, ${da.country}`;
      filteredUpdateData.deliveryContactName = da.contactName;
      filteredUpdateData.deliveryContactPhone = da.contactPhone;
    }
    
    // Update package
    await package.update(filteredUpdateData);
    
    // Fetch the updated package with associations
    const updatedPackage = await Package.findByPk(id, {
      include: [
        {
          model: Shop,
          attributes: ['businessName']
        },
        {
          model: Driver,
          attributes: ['id']
        }
      ]
    });
    
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
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver || package.driverId !== driver.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Get existing photos or initialize empty array
    let deliveryPhotos = [];
    if (package.deliveryPhotos) {
      try {
        deliveryPhotos = JSON.parse(package.deliveryPhotos);
      } catch (e) {
        deliveryPhotos = [];
      }
    }
    
    // Add new photo
    deliveryPhotos.push({
      url: photoUrl,
      timestamp: new Date()
    });
    
    // Update package
    await package.update({
      deliveryPhotos: deliveryPhotos
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
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver || package.driverId !== driver.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Add signature
    const signature = {
      data: signatureData,
      timestamp: new Date()
    };
    
    // Update package
    await package.update({
      signature: signature
    });
    
    res.json(package);
  } catch (error) {
    console.error('Error adding delivery signature:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update package payment status
exports.updatePackagePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid, paymentMethod, paymentNotes } = req.body;
    
    // Find the package
    const package = await Package.findByPk(id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization (only admin, shop that owns the package, or assigned driver can update payment)
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ where: { userId: req.user.id } });
      if (!shop || package.shopId !== shop.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role === 'driver') {
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver || package.driverId !== driver.id) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Update the payment status
    const updateData = {
      isPaid: Boolean(isPaid)
    };
    
    // Set payment date if paid
    if (Boolean(isPaid) && !package.isPaid) {
      updateData.paymentDate = new Date();
    } else if (!Boolean(isPaid)) {
      updateData.paymentDate = null;
    }
    
    // Log the payment status update
    console.log(`Updating payment status for package ${id} to ${isPaid ? 'paid' : 'unpaid'}`);
    if (paymentMethod) {
      console.log(`Payment method: ${paymentMethod}`);
    }
    if (paymentNotes) {
      console.log(`Payment notes: ${paymentNotes}`);
    }
    
    await package.update(updateData);
    
    res.json({
      message: `Payment status updated to ${isPaid ? 'paid' : 'unpaid'}`,
      package: {
        id: package.id,
        trackingNumber: package.trackingNumber,
        isPaid: package.isPaid,
        paymentDate: package.paymentDate
      }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: error.message });
  }
};
