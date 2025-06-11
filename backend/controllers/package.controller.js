const { Package, Shop, Driver, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.config');
const { getCairoDateTime, formatDateTimeToDDMMYYYY } = require('../utils/dateUtils');
const { logMoneyTransaction } = require('../utils/moneyLogger');

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
      codAmount,
      deliveryCost,
      paymentMethod,
      paymentNotes
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
      status: 'awaiting_schedule',
      // Pickup information
      pickupContactName: pickupAddress?.contactName || req.user.name,
      pickupContactPhone: pickupAddress?.contactPhone || req.user.phone,
      pickupAddress: pickupAddress ? `${pickupAddress.street}, ${pickupAddress.city}, ${pickupAddress.state} ${pickupAddress.zipCode}, ${pickupAddress.country}` : null,
      // Delivery information
      deliveryContactName: deliveryAddress.contactName,
      deliveryContactPhone: deliveryAddress.contactPhone,
      deliveryAddress: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}, ${deliveryAddress.country}`,
      schedulePickupTime: formatDateTimeToDDMMYYYY(getCairoDateTime(schedulePickupTime)),
      priority: priority || 'normal',
      // Financial information - COD amount and payment status
      codAmount: parseFloat(codAmount) || 0,
      deliveryCost: parseFloat(deliveryCost) || 0,
      paymentMethod: paymentMethod || null,
      paymentNotes: paymentNotes || null,
      isPaid: false,
      paymentStatus: 'pending'
    });
    
    console.log(`Created package with ID ${package.id}, tracking number ${trackingNumber}`);
    if (codAmount && parseFloat(codAmount) > 0) {
      console.log(`Package has COD amount of ${codAmount}`);
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
    const formattedPackages = packages.map(pkg => formatPackageForResponse(pkg));
    res.json({
      packages: formattedPackages,
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
    
    // Format the response with Cairo timezone dates
    const formattedPackage = formatPackageForResponse(package);
    res.json(formattedPackage);
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
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    
    if (!status) {
      await t.rollback();
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find package
    const package = await Package.findByPk(id, { transaction: t });
    if (!package) {
      await t.rollback();
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Check authorization
    if (req.user.role === 'shop') {
      const shop = await Shop.findOne({ 
        where: { userId: req.user.id },
        transaction: t
      });
      if (!shop || package.shopId !== shop.id) {
        await t.rollback();
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      // Shops can only cancel packages that aren't delivered
      if (status === 'cancelled' && package.status === 'delivered') {
        await t.rollback();
        return res.status(403).json({ message: 'Cannot cancel a delivered package' });
      }
    }
    
    // Log status change for debugging
    console.log(`Updating package ${id} status from ${package.status} to ${status} by ${req.user.id} (${req.user.role})`);
    if (note) {
      console.log(`Status change note: ${note}`);
    }
    
    // Save the original status and payment status values before updating
    const originalStatus = package.status;
    
    // Update package status
    await package.update({ status }, { transaction: t });
    
    // Get the shop for this package to update financial data
    const shop = await Shop.findByPk(package.shopId, { 
      transaction: t,
      lock: true // Add row-level locking
    });
    
    if (shop) {
      // When a package is marked as delivered and has COD
      if (status === 'delivered' && package.codAmount > 0) {
        console.log(`Package ${id} marked as delivered. Updating shop financial data.`);
        
        // Move amount from ToCollect to TotalCollected
        const codAmount = parseFloat(package.codAmount || 0);
        const currentToCollect = parseFloat(shop.ToCollect || 0);
        const currentTotalCollected = parseFloat(shop.TotalCollected || 0);
        
        // Calculate new amounts
        const newToCollect = Math.max(0, currentToCollect - codAmount);
        const newTotalCollected = currentTotalCollected + codAmount;
        
        console.log(`Shop financial update: ToCollect ${currentToCollect} -> ${newToCollect}, TotalCollected ${currentTotalCollected} -> ${newTotalCollected}`);
        
        // Update shop using direct SQL to avoid precision issues
        await sequelize.query(
          'UPDATE Shops SET ToCollect = :newToCollect, TotalCollected = :newTotalCollected WHERE id = :shopId',
          {
            replacements: { newToCollect, newTotalCollected, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        
        // Log the money transactions
        await logMoneyTransaction(shop.id, codAmount, 'TotalCollected', 'increase', `Package ${package.trackingNumber} delivered - COD collected`, t);
        
        // Update package payment status with properly formatted date
        await package.update({ 
          isPaid: true,
          paymentDate: formatDateTimeToDDMMYYYY(getCairoDateTime()),
          paymentStatus: 'paid',
          paymentMethod: 'cod',
          paymentNotes: 'COD collected on delivery'
        }, { transaction: t });
      }
      // When a package is cancelled, subtract from ToCollect
      else if (status === 'cancelled' && package.codAmount > 0) {
        console.log(`Package ${id} cancelled. Subtracting from shop's ToCollect.`);
        
        const codAmount = parseFloat(package.codAmount || 0);
        const currentToCollect = parseFloat(shop.ToCollect || 0);
        
        // Only subtract if the package had its COD added previously
        const wasCodAdded = ['pending','assigned','pickedup','in-transit'].includes(originalStatus.toLowerCase());
        const newToCollect = wasCodAdded ? Math.max(0, currentToCollect - codAmount) : currentToCollect;
        
        console.log('DEBUG - Calculation:', {
          currentToCollect,
          codAmount,
          newToCollect,
          calculation: `${currentToCollect} - ${codAmount} = ${newToCollect}`,
          wasCodAdded
        });
        
        // Apply balance change ONLY if COD was previously added
        if (wasCodAdded) {
          // Update shop using direct SQL to avoid precision issues
          await sequelize.query(
            'UPDATE Shops SET ToCollect = :newToCollect WHERE id = :shopId',
            {
              replacements: { newToCollect, shopId: shop.id },
              type: sequelize.QueryTypes.UPDATE,
              transaction: t
            }
          );
          
          // Log the money transaction
          await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${package.trackingNumber} cancelled`, t);
          
          console.log(`Shop (${shop.id}) ToCollect updated: ${currentToCollect} -> ${newToCollect}`);
        }
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
      ],
      transaction: t
    });
    
    // Commit the transaction
    await t.commit();
    
    // Format the response with Cairo timezone dates
    const formattedPackage = formatPackageForResponse(updatedPackage);
    res.json(formattedPackage);
  } catch (error) {
    await t.rollback();
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

// Cancel a package (shop only, if not delivered or already cancelled)
exports.cancelPackage = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    if (req.user.role !== 'shop') {
      await t.rollback();
      return res.status(403).json({ message: 'Only shops can cancel packages' });
    }

    const packageId = req.params.id;
    
    // Find package with its shop
    const pkg = await Package.findByPk(packageId, {
      include: [{
        model: Shop,
        required: true
      }],
      transaction: t
    });

    if (!pkg) {
      await t.rollback();
      return res.status(404).json({ message: 'Package not found' });
    }

    const shop = pkg.Shop; // Get the associated shop

    // Verify shop ownership
    if (!shop || shop.userId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ message: 'You do not have permission to cancel this package' });
    }

    // Check package status
    if (pkg.status === 'delivered') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot cancel a delivered package' });
    }
    if (pkg.status === 'cancelled') {
      await t.rollback();
      return res.status(400).json({ message: 'Package is already cancelled' });
    }

    // Log the exact values we're working with
    console.log('DEBUG - Values before update:', {
      shopId: shop.id,
      shopToCollect: shop.ToCollect,
      shopToCollectType: typeof shop.ToCollect,
      packageCodAmount: pkg.codAmount,
      packageCodAmountType: typeof pkg.codAmount,
      packageId: pkg.id,
      packageStatus: pkg.status
    });

    // Convert and validate values
    const currentToCollect = parseFloat(shop.ToCollect) || 0;
    const codAmount = parseFloat(pkg.codAmount) || 0;

    if (isNaN(currentToCollect) || isNaN(codAmount)) {
      console.error('Invalid numeric values:', { currentToCollect, codAmount });
      await t.rollback();
      return res.status(500).json({ message: 'Invalid numeric values encountered' });
    }

    // Only subtract if the package had its COD added previously. We assume this is true for packages that have status after pickup phase (pending/assigned/in-transit/delivered)
    const wasCodAdded = ['pending','assigned','pickedup','in-transit'].includes(pkg.status.toLowerCase());
    const newToCollect = wasCodAdded ? Math.max(0, currentToCollect - codAmount) : currentToCollect;

    console.log('DEBUG - Calculation:', {
      currentToCollect,
      codAmount,
      newToCollect,
      calculation: `${currentToCollect} - ${codAmount} = ${newToCollect}`
    });

    // Update driver stats if needed
    if (pkg.driverId) {
      const driver = await Driver.findByPk(pkg.driverId, { transaction: t });
      if (driver) {
        driver.totalCancelled += 1;
        if (['assigned', 'pickedup', 'in-transit'].includes(pkg.status)) {
          driver.activeAssign = Math.max(0, driver.activeAssign - 1);
        }
        await driver.save({ transaction: t });
      }
    }

    // Update package status
    pkg.status = 'cancelled';
    await pkg.save({ transaction: t });

    // Update shop's ToCollect if needed
    if (wasCodAdded && codAmount > 0) {
      // Update shop's ToCollect using direct SQL to avoid precision issues
      await sequelize.query(
        'UPDATE Shops SET ToCollect = :newToCollect WHERE id = :shopId',
        {
          replacements: { newToCollect, shopId: shop.id },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // Create money log within the transaction
      await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${pkg.trackingNumber} cancelled`, t);
      
      console.log(`Shop (${shop.id}) ToCollect updated: ${currentToCollect} -> ${newToCollect}`);
    }

    // Commit the transaction
    await t.commit();

    // Fetch final state
    const finalShop = await Shop.findByPk(shop.id);
    console.log('DEBUG - Final state:', {
      shopId: finalShop.id,
      finalToCollect: finalShop.ToCollect,
      finalToCollectType: typeof finalShop.ToCollect
    });

    res.json({ 
      message: 'Package cancelled successfully', 
      package: pkg,
      shop: {
        id: finalShop.id,
        ToCollect: finalShop.ToCollect
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Error cancelling package:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to format package data with Cairo timezone dates
const formatPackageForResponse = (package) => {
  const packageData = package.toJSON ? package.toJSON() : package;
  
  // Dates are now stored as formatted strings, so no formatting needed
  return packageData;
};
