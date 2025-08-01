const { Package, Shop, Driver, User, PickupPackages } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db.config');
const { getCairoDateTime, formatDateTimeToDDMMYYYY } = require('../utils/dateUtils');
const { logMoneyTransaction } = require('../utils/moneyLogger');
const { createNotification } = require('./notification.controller');

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
      paymentNotes,
      shopNotes,
      itemsNo
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
      deliveryCost: shop.shippingFees != null ? parseFloat(shop.shippingFees) : (parseFloat(deliveryCost) || 0),
      shownDeliveryCost: shop.shownShippingFees != null ? parseFloat(shop.shownShippingFees) : 0,
      paymentMethod: paymentMethod || null,
      paymentNotes: paymentNotes || null,
      shopNotes: shopNotes || null,
      itemsNo: itemsNo ? parseInt(itemsNo, 10) : null,
      isPaid: false,
      paymentStatus: 'pending'
    });
    
    console.log(`Created package with ID ${package.id}, tracking number ${trackingNumber}`);
    if (codAmount && parseFloat(codAmount) > 0) {
      console.log(`Package has COD amount of ${codAmount}`);
    }

    // Notify admin of new package
    try {
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      if (adminUser) {
        await createNotification({
          userId: adminUser.id,
          userType: 'admin',
          title: 'New Package Created',
          message: `A new package (Tracking: ${package.trackingNumber}) was created by shop ${shop.businessName}.`,
          data: { packageId: package.id, shopId: shop.id, shopName: shop.businessName }
        });
      }
    } catch (notifyErr) {
      console.error('Failed to notify admin of new package:', notifyErr);
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
        'codAmount', 'deliveryCost', 'shownDeliveryCost', 'isPaid', 'paymentDate', 'notes', 'shopNotes',
        'itemsNo'
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
        'codAmount', 'deliveryCost', 'shownDeliveryCost', 'isPaid', 'paymentDate', 'notes', 'shopNotes',
        'itemsNo'
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
        'deliveryContactName', 'estimatedDeliveryTime',
        'actualDeliveryTime', 'weight', 'dimensions',
        'pickupAddress', 'pickupContactName', 'priority', 'shopNotes',
        'notes'
      ],
      include: [
        {
          model: Driver,
          attributes: ['id', 'vehicleType', 'workingArea'],
          include: [
            {
              model: User,
              attributes: ['name', 'phone']
            }
          ]
        },
        {
          model: Shop,
          attributes: ['businessName']
        }
      ]
    });
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Format the response
    let statusHistory = package.statusHistory;
    if (typeof statusHistory === 'string') {
      try {
        statusHistory = JSON.parse(statusHistory);
      } catch {
        statusHistory = [];
      }
    }
    if (!Array.isArray(statusHistory)) statusHistory = [];

    const response = {
      trackingNumber: package.trackingNumber,
      status: package.status,
      statusHistory,
      packageDescription: package.packageDescription,
      createdAt: package.createdAt,
      estimatedDeliveryTime: package.estimatedDeliveryTime,
      actualDeliveryTime: package.actualDeliveryTime,
      weight: package.weight,
      dimensions: package.dimensions,
      // Delivery details
      deliveryAddress: package.deliveryAddress,
      deliveryContactName: package.deliveryContactName,
      // Pickup details
      pickupAddress: package.pickupAddress,
      pickupContactName: package.pickupContactName,
      // Shop details
      shop: package.Shop ? {
        name: package.Shop.businessName
      } : null,
      // Driver details (only if assigned)
      driver: package.Driver ? {
        name: package.Driver.User.name,
        phone: package.Driver.User.phone,
        vehicleType: package.Driver.vehicleType,
        workingArea: package.Driver.workingArea
      } : null,
      priority: package.priority,
      shopNotes: package.shopNotes,
      notes: package.notes
    };
    
    res.json(response);
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
    let nextStatus = status; // Use a mutable variable
    
    if (!nextStatus) {
      await t.rollback();
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Validate status
    const validStatuses = ['pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'cancelled-awaiting-return', 'cancelled-returned', 'rejected', 'rejected-awaiting-return', 'rejected-returned'];
    if (!validStatuses.includes(nextStatus)) {
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
      if (nextStatus === 'cancelled' && package.status === 'delivered') {
        await t.rollback();
        return res.status(403).json({ message: 'Cannot cancel a delivered package' });
      }
    }
    
    // Log status change for debugging
    console.log(`Updating package ${id} status from ${package.status} to ${nextStatus} by ${req.user.id} (${req.user.role})`);
    if (note) {
      console.log(`Status change note: ${note}`);
    }
    
    // Save the original status and payment status values before updating
    const originalStatus = package.status;
    
    // If marking a rejected package as pending, remove assigned driver
    if (nextStatus === 'pending' && package.status === 'rejected') {
      package.driverId = null;
    }
    
    // Handle rejected packages that have been picked up or are assigned or in transit
    if (nextStatus === 'rejected' && ['assigned', 'pickedup', 'in-transit'].includes(package.status)) {
      nextStatus = 'rejected-awaiting-return';
    }
    // --- BEGIN: Set actualPickupTime and actualDeliveryTime based on status change ---
    // If status is being set to 'pickedup', set actualPickupTime
    if (nextStatus === 'pickedup' && package.actualPickupTime == null) {
      package.actualPickupTime = getCairoDateTime();
    }
    // If status is being set to 'delivered', set actualDeliveryTime
    if (nextStatus === 'delivered' && package.actualDeliveryTime == null) {
      package.actualDeliveryTime = getCairoDateTime();
    }
    // If status is being changed from 'delivered' to something else, clear actualDeliveryTime
    if (originalStatus === 'delivered' && nextStatus !== 'delivered') {
      package.actualDeliveryTime = null;
    }
    // --- END: Set actualPickupTime and actualDeliveryTime based on status change ---
    // Update package status
    package.status = nextStatus;
    
    // If the package is cancelled or rejected and was not yet picked up, remove it from the pickup and PickupPackages join table
    if (
      (nextStatus === 'cancelled' || nextStatus === 'rejected' || nextStatus === 'rejected-awaiting-return') &&
      ["awaiting_schedule", "awaiting_pickup", "scheduled_for_pickup", "pending", "assigned"].includes(package._previousDataValues.status)
    ) {
      package.pickupId = null;
      await PickupPackages.destroy({
        where: {
          packageId: package.id
        },
        transaction: t
      });
    }
    await package.save({ transaction: t });
    
    // Get the shop for this package to update financial data
    const shop = await Shop.findByPk(package.shopId, { 
      transaction: t,
      lock: true // Add row-level locking
    });
    
    // === COD transfer logic when delivered ===
    if (
      nextStatus === 'delivered' &&
      originalStatus !== 'delivered' &&
      shop &&
      package.codAmount > 0
    ) {
      const codAmount = parseFloat(package.codAmount || 0);
      const currentToCollect = parseFloat(shop.ToCollect || 0);
      const currentTotalCollected = parseFloat(shop.TotalCollected || 0);
      // Subtract from ToCollect, add to TotalCollected
      const newToCollect = Math.max(0, currentToCollect - codAmount);
      const newTotalCollected = currentTotalCollected + codAmount;
      // Update shop
      await sequelize.query(
        'UPDATE Shops SET ToCollect = :newToCollect, TotalCollected = :newTotalCollected WHERE id = :shopId',
        {
          replacements: { newToCollect, newTotalCollected, shopId: shop.id },
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      // Log both transactions
      await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${package.trackingNumber} delivered (COD moved to Collected)`, t);
      await logMoneyTransaction(shop.id, codAmount, 'TotalCollected', 'increase', `Package ${package.trackingNumber} delivered (COD collected)`, t);
      // Mark package as paid
      package.isPaid = true;
      await package.save({ transaction: t });
    }

    // === Increment Stats.profit by deliveryCost when delivered ===
    if (
      nextStatus === 'delivered' &&
      originalStatus !== 'delivered'
    ) {
      const deliveryCost = parseFloat(package.deliveryCost || 0);
      if (deliveryCost > 0) {
        await sequelize.query(
          'UPDATE Stats SET profit = profit + :amount',
          {
            replacements: { amount: deliveryCost },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        
        // Log revenue transaction for the shop
        await logMoneyTransaction(
          shop.id, 
          deliveryCost, 
          'Revenue', 
          'increase', 
          `Package ${package.trackingNumber} delivered (delivery cost revenue)`, 
          t
        );
      }
    }
    
    // Update driver statistics if the package has a driver assigned
    if (package.driverId) {
      const driver = await Driver.findByPk(package.driverId, { transaction: t });
      if (driver) {
        // When package is marked as delivered
        if (nextStatus === 'delivered') {
          driver.totalDeliveries += 1;
          driver.activeAssign = Math.max(0, driver.activeAssign - 1);
          await driver.save({ transaction: t });
        }
        // When package is cancelled
        else if (nextStatus === 'cancelled') {
          driver.totalCancelled += 1;
          if (['assigned', 'pickedup', 'in-transit'].includes(originalStatus)) {
            driver.activeAssign = Math.max(0, driver.activeAssign - 1);
          }
          await driver.save({ transaction: t });
        }
      }
    }
    
    // 1. If shop marks a rejected package as cancelled-awaiting-return, increment driver's totalCancelled
    if (
      nextStatus === 'cancelled-awaiting-return' &&
      originalStatus === 'rejected' &&
      req.user.role === 'shop' &&
      package.driverId
    ) {
      const driver = await Driver.findByPk(package.driverId, { transaction: t });
      if (driver) {
        driver.totalCancelled += 1;
        await driver.save({ transaction: t });
      }
    }

    // 2. If admin marks a package as cancelled-returned, subtract COD from shop's ToCollect
    if (
      nextStatus === 'cancelled-returned' &&
      req.user.role === 'admin' &&
      package.codAmount > 0 &&
      shop
    ) {
      const codAmount = parseFloat(package.codAmount || 0);
      const currentToCollect = parseFloat(shop.ToCollect || 0);
      // Only subtract if the package had its COD added previously
      const wasCodAdded = ['pending','assigned','pickedup','in-transit','delivered','cancelled-awaiting-return'].includes(originalStatus.toLowerCase());
      const newToCollect = wasCodAdded ? Math.max(0, currentToCollect - codAmount) : currentToCollect;
      if (wasCodAdded && codAmount > 0) {
        await sequelize.query(
          'UPDATE Shops SET ToCollect = :newToCollect WHERE id = :shopId',
          {
            replacements: { newToCollect, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${package.trackingNumber} returned to shop`, t);
      }
    }
    
    // 3. If admin marks a package as rejected-returned, subtract COD from shop's ToCollect
    if (
      nextStatus === 'rejected-returned' &&
      req.user.role === 'admin' &&
      package.codAmount > 0 &&
      shop
    ) {
      const codAmount = parseFloat(package.codAmount || 0);
      const currentToCollect = parseFloat(shop.ToCollect || 0);
      // Only subtract if the package had its COD added previously
      const wasCodAdded = ['pending','assigned','pickedup','in-transit','delivered','rejected-awaiting-return'].includes(originalStatus.toLowerCase());
      const newToCollect = wasCodAdded ? Math.max(0, currentToCollect - codAmount) : currentToCollect;
      if (wasCodAdded && codAmount > 0) {
        await sequelize.query(
          'UPDATE Shops SET ToCollect = :newToCollect WHERE id = :shopId',
          {
            replacements: { newToCollect, shopId: shop.id },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );
        await logMoneyTransaction(shop.id, codAmount, 'ToCollect', 'decrease', `Package ${package.trackingNumber} rejected and returned to shop`, t);
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

    // Notify admin of package status change
    try {
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      if (adminUser) {
        // Get shop name
        let shopName = '';
        if (package.shopId) {
          const shop = await Shop.findByPk(package.shopId);
          if (shop) shopName = shop.businessName;
        }
        await createNotification({
          userId: adminUser.id,
          userType: 'admin',
          title: 'Package Status Changed',
          message: `Package (Tracking: ${package.trackingNumber}) for shop ${shopName} status changed from ${originalStatus} to ${nextStatus}.`,
          data: { packageId: package.id, oldStatus: originalStatus, newStatus: nextStatus, shopName }
        });
      }
      // Notify shop of package status change
      if (package.shopId) {
        const shop = await Shop.findByPk(package.shopId);
        if (shop) {
          const shopUser = await User.findByPk(shop.userId);
          if (shopUser) {
            let title = 'Package Status Changed';
            let message = `The status of your package (Tracking: ${package.trackingNumber}) has changed from ${originalStatus} to ${nextStatus}.`;
            if (nextStatus === 'pickedup') {
              title = 'Package Picked Up';
              message = `Your package (Tracking: ${package.trackingNumber}) has been picked up.`;
            }
            await createNotification({
              userId: shopUser.id,
              userType: 'shop',
              title,
              message,
              data: { packageId: package.id, oldStatus: originalStatus, newStatus: nextStatus, shopName: shop.businessName }
            });
          }
        }
      }
    } catch (notifyErr) {
      console.error('Failed to notify admin or shop of package status change:', notifyErr);
    }

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
      'priority', 'notes', 'deliveryFee',
      'shownDeliveryCost'
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
      // Shops can only update shownDeliveryCost for any status, other fields only if pending
      const onlyShownDeliveryCost = Object.keys(filteredUpdateData).every(key => key === 'shownDeliveryCost');
      if (!onlyShownDeliveryCost && package.status !== 'pending') {
        return res.status(403).json({ message: 'Can only update packages with pending status, except shownDeliveryCost' });
      }
      // Prevent shownDeliveryCost > deliveryCost
      if (
        'shownDeliveryCost' in filteredUpdateData &&
        (parseFloat(filteredUpdateData.shownDeliveryCost) > parseFloat(package.deliveryCost))
      ) {
        return res.status(400).json({ message: 'Shown Delivery Cost cannot be greater than Delivery Cost.' });
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
    if (['pending', 'assigned', 'pickedup', 'in-transit'].includes(pkg.status)) {
      pkg.status = 'cancelled-awaiting-return';
    } else {
      pkg.status = 'cancelled';
    }
    
    // If the package is cancelled and was not yet picked up, remove it from the pickup and PickupPackages join table
    if (
      pkg.status !== "cancelled-awaiting-return" &&
      ["awaiting_schedule", "awaiting_pickup", "scheduled_for_pickup", "pending", "assigned"].includes(pkg._previousDataValues.status)
    ) {
      pkg.pickupId = null;
      await PickupPackages.destroy({
        where: {
          packageId: pkg.id
        },
        transaction: t
      });
    }
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

// Update package notes (log system)
exports.updatePackageNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body; // Expecting a single note string

    if (!note || typeof note !== 'string' || !note.trim()) {
      return res.status(400).json({ message: 'Note text is required.' });
    }

    // Find package
    const packageObj = await Package.findByPk(id);
    if (!packageObj) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Only allow drivers assigned to this package, or shop/admin
    let author = 'system';
    if (req.user.role === 'driver') {
      const Driver = require('../models/driver.model');
      const driver = await Driver.findOne({ where: { userId: req.user.id } });
      if (!driver) {
        return res.status(403).json({ message: 'Driver profile not found for this user.' });
      }
      if (packageObj.driverId !== driver.id) {
        return res.status(403).json({ message: 'You are not assigned to this package.' });
      }
      author = `driver:${driver.id}`;
    } else if (req.user.role === 'shop') {
      author = `shop:${req.user.id}`;
    } else if (req.user.role === 'admin') {
      author = 'admin';
    }

    // Get current notes log (array)
    let notesLog = [];
    try {
      if (packageObj.notes) {
        if (typeof packageObj.notes === 'string') {
          notesLog = JSON.parse(packageObj.notes);
        } else if (Array.isArray(packageObj.notes)) {
          notesLog = packageObj.notes;
        } else if (typeof packageObj.notes === 'object') {
          notesLog = [packageObj.notes];
        }
      }
      if (!Array.isArray(notesLog)) notesLog = [];
    } catch (e) {
      notesLog = [];
    }
    // Append new note
    notesLog.push({
      text: note,
      createdAt: new Date().toISOString(),
      author
    });
    // Update notes (always stringify, like statusHistory)
    await packageObj.update({ notes: JSON.stringify(notesLog) });
    res.json({ message: 'Note added', notes: notesLog });
  } catch (error) {
    console.error('Error updating package notes:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to format package data with Cairo timezone dates
const formatPackageForResponse = (package) => {
  const packageData = package.toJSON ? package.toJSON() : package;
  
  // Dates are now stored as formatted strings, so no formatting needed
  return packageData;
};
