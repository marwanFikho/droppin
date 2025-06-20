const { Op, QueryTypes } = require('sequelize');
const { sequelize, User, Shop, Driver, Package } = require('../models/index');
const { formatDateTimeToDDMMYYYY, getCairoDateTime } = require('../utils/dateUtils');
const { logMoneyTransaction } = require('../utils/moneyLogger');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get user counts
    const totalUsers = await User.count({ where: { role: 'user' } });
    const totalShops = await User.count({ where: { role: 'shop' } });
    const totalDrivers = await User.count({ where: { role: 'driver' } });
    const pendingApprovals = await User.count({ 
      where: { 
        isApproved: false,
        role: ['shop', 'driver']
      }
    });

    // Get package counts
    const totalPackages = await Package.count();
    const pendingPackages = await Package.count({ where: { status: 'pending' } });
    const inTransitPackages = await Package.count({ 
      where: { status: ['assigned', 'pickedup', 'in-transit'] }
    });
    const deliveredPackages = await Package.count({ where: { status: 'delivered' } });

    res.json({
      users: {
        total: totalUsers + totalShops + totalDrivers,
        customers: totalUsers,
        shops: totalShops,
        drivers: totalDrivers,
        pendingApprovals
      },
      packages: {
        total: totalPackages,
        pending: pendingPackages,
        inTransit: inTransitPackages,
        delivered: deliveredPackages
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all users (with optional filtering)
exports.getUsers = async (req, res) => {
  try {
    const { role, isApproved, search } = req.query;
    const whereClause = {};
    
    // Add role filter if provided
    if (role && role !== 'all') {
      whereClause.role = role;
    }
    
    // Add approval status filter if provided
    if (isApproved !== undefined) {
      whereClause.isApproved = isApproved === 'true';
    }
    
    // Add search filter if provided
    if (search) {
      whereClause[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${search}%` } },
        { email: { [sequelize.Op.like]: `%${search}%` } },
        { phone: { [sequelize.Op.like]: `%${search}%` } }
      ];
    }
    
    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    // Fetch additional data for shops and drivers
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      const userData = user.toJSON();
      
      if (user.role === 'shop') {
        const shop = await Shop.findOne({ where: { userId: user.id } });
        if (shop) {
          userData.businessName = shop.businessName;
          userData.businessType = shop.businessType;
          userData.shopId = shop.id;
        }
      } else if (user.role === 'driver') {
        const driver = await Driver.findOne({ where: { userId: user.id } });
        if (driver) {
          userData.vehicleType = driver.vehicleType;
          userData.licensePlate = driver.licensePlate;
          userData.model = driver.model;
          userData.color = driver.color;
          userData.driverLicense = driver.driverLicense;
          userData.driverId = driver.id;
        }
      }
      
      return userData;
    }));
    
    res.json(enhancedUsers);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get pending approval requests
exports.getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { 
        isApproved: false,
        role: ['shop', 'driver']
      },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    // Fetch additional data for shops and drivers
    const enhancedUsers = await Promise.all(pendingUsers.map(async (user) => {
      const userData = user.toJSON();
      
      if (user.role === 'shop') {
        const shop = await Shop.findOne({ where: { userId: user.id } });
        if (shop) {
          userData.businessName = shop.businessName;
          userData.businessType = shop.businessType;
          userData.shopId = shop.id;
        }
      } else if (user.role === 'driver') {
        const driver = await Driver.findOne({ where: { userId: user.id } });
        if (driver) {
          userData.vehicleType = driver.vehicleType;
          userData.licensePlate = driver.licensePlate;
          userData.model = driver.model;
          userData.color = driver.color;
          userData.driverLicense = driver.driverLicense;
          userData.driverId = driver.id;
        }
      }
      
      return userData;
    }));
    
    res.json(enhancedUsers);
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({ message: error.message });
  }
};

// Approve or reject a user
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    if (approved === undefined) {
      return res.status(400).json({ message: 'Approval status is required' });
    }
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.update({ isApproved: approved });
    
    res.json({ 
      message: `User ${approved ? 'approved' : 'rejected'} successfully`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all shops
exports.getShops = async (req, res) => {
  try {
    const { isApproved, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    // First, get all users with role 'shop'
    const whereClause = { role: 'shop' };
    
    // Add approval status filter if provided
    if (isApproved !== undefined) {
      whereClause.isApproved = isApproved === 'true';
    }
    
    const shopUsers = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    // Get shop details for each user
    const shops = await Promise.all(shopUsers.map(async (user) => {
      const userData = user.toJSON();
      const shop = await Shop.findOne({ where: { userId: user.id } });
      
      if (shop) {
        // Get financial data directly with SQL to ensure accuracy
        const [financialData] = await sequelize.query(
          `SELECT id, ToCollect, TotalCollected FROM Shops WHERE id = :shopId`,
          {
            replacements: { shopId: shop.id },
            type: QueryTypes.SELECT
          }
        );
        
        console.log(`Shop ${shop.id} financial data from SQL:`, financialData);
        
        // Use the database columns directly from the SQL result
        const totalToCollect = parseFloat(financialData.ToCollect || 0);
        const totalCollected = parseFloat(financialData.TotalCollected || 0);
        
        // Get package count for this shop
        const packageCount = await Package.count({ where: { shopId: shop.id } });
        
        // Find the main driver for this shop (if any)
        const mainDriver = null;
        
        // Return shop data with financial values from the direct SQL query
        return {
          ...userData,
          shopId: shop.id,
          businessName: shop.businessName,
          businessType: shop.businessType,
          contactPersonName: shop.contactPersonName,
          contactPersonPhone: shop.contactPersonPhone,
          contactPersonEmail: shop.contactPersonEmail,
          // Use the financial data directly from the SQL query
          ToCollect: financialData.ToCollect,
          TotalCollected: financialData.TotalCollected,
          // Include raw values for compatibility
          rawToCollect: financialData.ToCollect,
          rawTotalCollected: financialData.TotalCollected,
          financialData: {
            totalToCollect,
            totalCollected, 
            totalSettled: 0,
            packageCount: packageCount
          },
          workingArea: mainDriver ? mainDriver.workingArea : null
        };
      }
      
      return userData;
    }));
    
    // Apply search filter if provided
    let result = shops;
    if (search) {
      const searchTerm = search.toLowerCase();
      result = shops.filter(shop => 
        shop.name?.toLowerCase().includes(searchTerm) ||
        shop.email?.toLowerCase().includes(searchTerm) ||
        shop.businessName?.toLowerCase().includes(searchTerm) ||
        shop.businessType?.toLowerCase().includes(searchTerm) ||
        shop.address?.toLowerCase().includes(searchTerm) ||
        shop.city?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    if (sortBy === 'ToCollect' || sortBy === 'TotalCollected') {
      result.sort((a, b) => {
        const aValue = parseFloat(a[sortBy] || 0);
        const bValue = parseFloat(b[sortBy] || 0);
        return sortOrder === 'DESC' ? bValue - aValue : aValue - bValue;
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error getting shops:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single shop by ID
exports.getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Getting shop data for ID: ${id}`);
    
    // First find the shop record
    const shop = await Shop.findByPk(id);
    
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Get the user associated with this shop
    const user = await User.findByPk(shop.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Shop user not found' });
    }
    
    // Get shop's packages for stats
    const packages = await Package.findAll({ where: { shopId: shop.id } });
    
    // Get exact database values for financial columns
    const [financialData] = await sequelize.query(
      `SELECT ToCollect, TotalCollected FROM Shops WHERE id = :shopId`,
      {
        replacements: { shopId: shop.id },
        type: QueryTypes.SELECT
      }
    );
    
    console.log('Financial data from direct query:', financialData);
    
    // Prepare response with all shop data
    const shopData = {
      id: shop.id,
      userId: shop.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isApproved: user.isApproved,
      businessName: shop.businessName,
      businessType: shop.businessType,
      contactPersonName: shop.contactPersonName,
      contactPersonPhone: shop.contactPersonPhone,
      contactPersonEmail: shop.contactPersonEmail,
      // Using direct SQL results for financial data
      ToCollect: financialData.ToCollect,
      TotalCollected: financialData.TotalCollected,
      // Include package count
      packageCount: packages.length,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt
    };
    
    res.json(shopData);
  } catch (error) {
    console.error(`Error getting shop with ID ${req.params.id}:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Approve or reject a shop - COMPLETELY REWRITTEN to be as simple as possible
exports.approveShop = async (req, res) => {
  try {
    // Get parameters
    const { id } = req.params;
    const { approved } = req.body;
    
    console.log('Shop approval request:', { id, approved });
    
    // Validation
    if (approved === undefined) {
      return res.status(400).json({ message: 'Approval status is required' });
    }
    
    // DIRECT APPROACH: We're going to try multiple approaches
    // If approved, update isApproved to true. If rejected, delete the entity
    
    // 1. Try finding the shop by Shop ID
    try {
      const shop = await Shop.findByPk(id);
      if (shop) {
        console.log('Found shop by shop ID:', id, 'with userId:', shop.userId);
        
        if (approved) {
          // Approve: Update the user
          await sequelize.query(
            'UPDATE Users SET isApproved = 1 WHERE id = ?',
            { replacements: [shop.userId] }
          );
          
          return res.json({
            success: true,
            message: 'Shop approved successfully'
          });
        } else {
          // Reject: Delete the shop and associated user
          console.log('Deleting rejected shop and associated user');
          const userId = shop.userId;
          
          // Use transaction to ensure both operations succeed or fail together
          const transaction = await sequelize.transaction();
          try {
            // First delete the shop (due to FK constraints)
            await shop.destroy({ transaction });
            
            // Then delete the user
            const user = await User.findByPk(userId, { transaction });
            if (user) {
              await user.destroy({ transaction });
            }
            
            await transaction.commit();
            
            return res.json({
              success: true,
              message: 'Shop rejected and removed from the system'
            });
          } catch (deleteError) {
            await transaction.rollback();
            throw deleteError;
          }
        }
      }
    } catch (shopError) {
      console.error('Error processing shop by shop ID:', shopError);
      // Continue to next approach
    }
    
    // 2. Try finding the user directly
    try {
      const user = await User.findByPk(id);
      if (user && user.role === 'shop') {
        console.log('Found user directly by user ID:', id);
        
        if (approved) {
          // Approve: Update the user
          await user.update({ isApproved: true });
          
          return res.json({
            success: true,
            message: 'Shop approved successfully'
          });
        } else {
          // Reject: Delete the user and associated shop
          console.log('Deleting rejected user and associated shop');
          
          // Use transaction to ensure both operations succeed or fail together
          const transaction = await sequelize.transaction();
          try {
            // Find the shop associated with this user
            const shop = await Shop.findOne({ 
              where: { userId: user.id },
              transaction 
            });
            
            // Delete the shop if found
            if (shop) {
              await shop.destroy({ transaction });
            }
            
            // Delete the user
            await user.destroy({ transaction });
            
            await transaction.commit();
            
            return res.json({
              success: true,
              message: 'Shop rejected and removed from the system'
            });
          } catch (deleteError) {
            await transaction.rollback();
            throw deleteError;
          }
        }
      }
    } catch (userError) {
      console.error('Error processing user by ID:', userError);
      // Continue to next approach
    }
    
    // 3. Try finding a shop where userId = id
    try {
      const shopByUserId = await Shop.findOne({ where: { userId: id } });
      if (shopByUserId) {
        console.log('Found shop by userId:', id);
        
        if (approved) {
          // Approve: Update the user
          await sequelize.query(
            'UPDATE Users SET isApproved = 1 WHERE id = ?',
            { replacements: [id] }
          );
          
          return res.json({
            success: true,
            message: 'Shop approved successfully'
          });
        } else {
          // Reject: Delete the shop and user
          console.log('Deleting rejected shop found by userId and the associated user');
          
          // Use transaction to ensure both operations succeed or fail together
          const transaction = await sequelize.transaction();
          try {
            // Delete the shop
            await shopByUserId.destroy({ transaction });
            
            // Delete the user
            const user = await User.findByPk(id, { transaction });
            if (user) {
              await user.destroy({ transaction });
            }
            
            await transaction.commit();
            
            return res.json({
              success: true,
              message: 'Shop rejected and removed from the system'
            });
          } catch (deleteError) {
            await transaction.rollback();
            throw deleteError;
          }
        }
      }
    } catch (shopUserIdError) {
      console.error('Error processing shop by userId:', shopUserIdError);
      // Fall through to the error below
    }
    
    // If we got here, we couldn't find any suitable records to update
    console.error('Could not find any shop or user records to update with ID:', id);
    return res.status(404).json({ message: 'Could not find shop or user to update' });
    
  } catch (error) {
    console.error('Error in shop approval process:', error);
    res.status(500).json({ message: 'Failed to update approval status' });
  }
};

// Get all drivers
exports.getDrivers = async (req, res) => {
  try {
    const { isApproved, search } = req.query;
    
    // First, get all users with role 'driver'
    const whereClause = { role: 'driver' };
    
    // Add approval status filter if provided
    if (isApproved !== undefined) {
      whereClause.isApproved = isApproved === 'true';
    }
    
    const driverUsers = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    // Get driver details for each user
    const drivers = await Promise.all(driverUsers.map(async (user) => {
      const userData = user.toJSON();
      const driver = await Driver.findOne({ where: { userId: user.id } });
      
      if (driver) {
        // Count assigned packages for this driver
        const assignedPackagesCount = await Package.count({
          where: {
            driverId: driver.id
          }
        });
        
        // Count all-time delivered packages
        const deliveredPackagesCount = await Package.count({
          where: {
            driverId: driver.id,
            status: 'delivered'
          }
        });
        
        return {
          ...userData,
          driverId: driver.id,
          vehicleType: driver.vehicleType,
          licensePlate: driver.licensePlate,
          model: driver.model,
          color: driver.color,
          driverLicense: driver.driverLicense,
          isAvailable: driver.isAvailable,
          workingArea: driver.workingArea,
          totalDeliveries: driver.totalDeliveries,
          totalAssigned: driver.totalAssigned,
          activeAssign: driver.activeAssign,
          assignedToday: driver.assignedToday,
          stats: {
            assignedPackages: assignedPackagesCount,
            deliveredPackages: deliveredPackagesCount,
            totalPackages: assignedPackagesCount + deliveredPackagesCount
          }
        };
      }
      
      return userData;
    }));
    
    // Apply search filter if provided
    let result = drivers;
    if (search) {
      const searchTerm = search.toLowerCase();
      result = drivers.filter(driver => 
        driver.name?.toLowerCase().includes(searchTerm) ||
        driver.email?.toLowerCase().includes(searchTerm) ||
        driver.licensePlate?.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ message: error.message });
  }
};

// Approve or reject a driver - COMPLETELY REWRITTEN to be as simple as possible
exports.approveDriver = async (req, res) => {
  let transaction;
  
  try {
    console.log('Driver approval request:', { params: req.params, body: req.body });
    
    const { id } = req.params;
    const { approved } = req.body;
    
    if (approved === undefined) {
      return res.status(400).json({ message: 'Approval status is required' });
    }
    
    // DIRECT APPROACH: We're going to try multiple approaches to find and update the user
    // since there seems to be confusion about whether we're getting a driver ID or user ID
    
    // 1. Try finding the driver by Driver ID
    try {
      const driver = await Driver.findByPk(id);
      if (driver) {
        console.log('Found driver by driver ID:', id, 'with userId:', driver.userId);
        
        if (approved) {
          // Approve: Update the user
          await sequelize.query(
            'UPDATE Users SET isApproved = 1 WHERE id = ?',
            { replacements: [driver.userId] }
          );
          
          return res.json({
            success: true,
            message: 'Driver approved successfully'
          });
        } else {
          // Reject: Delete the driver and associated user
          console.log('Deleting rejected driver and associated user');
          const userId = driver.userId;
          
          // Use transaction to ensure both operations succeed or fail together
          const transaction = await sequelize.transaction();
          try {
            // First delete the driver (due to FK constraints)
            await driver.destroy({ transaction });
            
            // Then delete the user
            const user = await User.findByPk(userId, { transaction });
            if (user) {
              await user.destroy({ transaction });
            }
            
            await transaction.commit();
            
            return res.json({
              success: true,
              message: 'Driver rejected and removed from the system'
            });
          } catch (deleteError) {
            await transaction.rollback();
            throw deleteError;
          }
        }
      }
    } catch (driverError) {
      console.error('Error processing driver by driver ID:', driverError);
      // Continue to next approach
    }
    
    // 2. Try finding the user directly
    try {
      const user = await User.findByPk(id);
      if (user && user.role === 'driver') {
        console.log('Found user directly by user ID:', id);
        
        if (approved) {
          // Approve: Update the user
          await user.update({ isApproved: true });
          
          return res.json({
            success: true,
            message: 'Driver approved successfully'
          });
        } else {
          // Reject: Delete the user and associated driver
          console.log('Deleting rejected user and associated driver');
          
          // Use transaction to ensure both operations succeed or fail together
          const transaction = await sequelize.transaction();
          try {
            // Find the driver associated with this user
            const driver = await Driver.findOne({ 
              where: { userId: user.id },
              transaction 
            });
            
            // Delete the driver if found
            if (driver) {
              await driver.destroy({ transaction });
            }
            
            // Delete the user
            await user.destroy({ transaction });
            
            await transaction.commit();
            
            return res.json({
              success: true,
              message: 'Driver rejected and removed from the system'
            });
          } catch (deleteError) {
            await transaction.rollback();
            throw deleteError;
          }
        }
      }
    } catch (userError) {
      console.error('Error processing user by ID:', userError);
      // Continue to next approach
    }
    
    // 3. Try finding a driver where userId = id
    try {
      const driverByUserId = await Driver.findOne({ where: { userId: id } });
      if (driverByUserId) {
        console.log('Found driver by userId:', id);
        
        if (approved) {
          // Approve: Update the user
          await sequelize.query(
            'UPDATE Users SET isApproved = 1 WHERE id = ?',
            { replacements: [id] }
          );
          
          return res.json({
            success: true,
            message: 'Driver approved successfully'
          });
        } else {
          // Reject: Delete the driver and user
          console.log('Deleting rejected driver found by userId and the associated user');
          
          // Use transaction to ensure both operations succeed or fail together
          const transaction = await sequelize.transaction();
          try {
            // Delete the driver
            await driverByUserId.destroy({ transaction });
            
            // Delete the user
            const user = await User.findByPk(id, { transaction });
            if (user) {
              await user.destroy({ transaction });
            }
            
            await transaction.commit();
            
            return res.json({
              success: true,
              message: 'Driver rejected and removed from the system'
            });
          } catch (deleteError) {
            await transaction.rollback();
            throw deleteError;
          }
        }
      }
    } catch (driverUserIdError) {
      console.error('Error processing driver by userId:', driverUserIdError);
      // Fall through to the error below
    }
    
    // If we got here, we couldn't find any suitable records to update
    console.error('Could not find any driver or user records to update with ID:', id);
    return res.status(404).json({ message: 'Could not find driver or user to update' });
    
  } catch (error) {
    console.error('Error in driver approval process:', error);
    res.status(500).json({ message: 'Failed to update approval status' });
  } finally {
    // If the transaction still exists, roll it back
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
  }
};

// Assign driver to package
exports.assignDriverToPackage = async (req, res) => {
  console.log('assignDriverToPackage called');
  console.log('req.params:', req.params);
  console.log('req.body:', req.body);
  console.log('req.headers:', req.headers);
  
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    const transaction = await sequelize.transaction();
    
    try {
      const { packageId } = req.params;
      const { driverId } = req.body;
      
      console.log('packageId:', packageId);
      console.log('driverId:', driverId);
      
      if (!driverId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Driver ID is required' });
      }

      // Find the package
      const package = await Package.findByPk(packageId, { transaction });
      if (!package) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Package not found' });
      }

      // Check if package is already assigned
      if (package.driverId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Package is already assigned to a driver' });
      }

      // Find the driver
      const driver = await Driver.findByPk(driverId, { transaction });
      if (!driver) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Driver not found' });
      }

      // Check if driver is available
      if (!driver.isAvailable) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Driver is not available' });
      }

      // Find the user associated with the driver
      const driverUser = await User.findByPk(driver.userId, { transaction });
      if (!driverUser || !driverUser.isApproved) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Driver account is not approved' });
      }

      // Update package with driver ID and change status to 'assigned'
      let statusHistory = [];
      try {
        statusHistory = JSON.parse(package.statusHistory || '[]');
      } catch (parseError) {
        console.log('Error parsing statusHistory, using empty array:', parseError);
        statusHistory = [];
      }
      
      statusHistory.push({
        status: 'assigned',
        timestamp: new Date(),
        note: `Assigned to driver ID: ${driverId}`,
        updatedBy: req.user.id
      });

      await package.update({
        driverId: driverId,
        status: 'assigned',
        statusHistory: JSON.stringify(statusHistory)
      }, { transaction });

      // Update driver statistics
      await driver.update({
        assignedToday: driver.assignedToday + 1,
        totalAssigned: driver.totalAssigned + 1,
        activeAssign: driver.activeAssign + 1
      }, { transaction });

      await transaction.commit();
      
      console.log(`Successfully assigned driver ${driverId} to package ${packageId}`);
      return res.json({ 
        message: 'Driver assigned successfully',
        package: package,
        driver: driver
      });
      
    } catch (error) {
      await transaction.rollback();
      retryCount++;
      
      // Check if it's a database lock error
      if (error.name === 'SequelizeTimeoutError' && error.parent?.code === 'SQLITE_BUSY' && retryCount < maxRetries) {
        console.log(`Database locked, retrying in 500ms... (attempt ${retryCount} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      console.error('Error assigning driver to package:', error);
      return res.status(500).json({ message: error.message });
    }
  }
};

// Get all packages (with optional filtering)
exports.getPackages = async (req, res) => {
  try {
    console.log('Getting packages with query:', req.query);
    const { status, shopId, search } = req.query;
    const whereClause = {};
    
    // Add status filter if provided
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    // Add shop filter if provided
    if (shopId) {
      whereClause.shopId = shopId;
    }
    
    // Add search filter if provided
    if (search) {
      // Use the Op object imported directly from sequelize to avoid issues
      whereClause[Op.or] = [
        { trackingNumber: { [Op.like]: `%${search}%` } },
        { packageDescription: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const packages = await Package.findAll({
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
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    
    // Fetch additional data for each package
    const enhancedPackages = await Promise.all(packages.map(async (pkg) => {
      const packageData = pkg.toJSON();
      
      // Dates are now stored as formatted strings, so no formatting needed
      
      // Get shop info
      if (pkg.shopId) {
        const shop = await Shop.findByPk(pkg.shopId);
        if (shop) {
          const shopUser = await User.findByPk(shop.userId, {
            attributes: ['name', 'email', 'phone']
          });
          
          packageData.shop = {
            id: shop.id,
            businessName: shop.businessName,
            contact: shopUser ? {
              name: shopUser.name,
              email: shopUser.email,
              phone: shopUser.phone
            } : null
          };
        }
      }
      
      // Get driver info
      if (pkg.driverId) {
        const driver = await Driver.findByPk(pkg.driverId);
        if (driver) {
          const driverUser = await User.findByPk(driver.userId, {
            attributes: ['name', 'email', 'phone']
          });
          
          packageData.driver = {
            id: driver.id,
            vehicleType: driver.vehicleType,
            licensePlate: driver.licensePlate,
            contact: driverUser ? {
              name: driverUser.name,
              email: driverUser.email,
              phone: driverUser.phone
            } : null
          };
        }
      }
      
      return packageData;
    }));
    
    res.json(enhancedPackages);
  } catch (error) {
    console.error('Error getting packages:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update package payment details
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updatePackagePayment = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { isPaid, paymentMethod, paymentNotes } = req.body;
    
    // Find package
    const packageItem = await Package.findByPk(packageId);
    
    if (!packageItem) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Update payment details
    const updates = {};
    
    if (isPaid !== undefined) {
      updates.isPaid = isPaid;
      
      // If marking as paid, set payment date
      if (isPaid) {
        updates.paymentDate = formatDateTimeToDDMMYYYY(getCairoDateTime());
      } else {
        updates.paymentDate = null;
      }
    }
    
    if (paymentMethod) {
      updates.paymentMethod = paymentMethod;
    }
    
    if (paymentNotes) {
      updates.paymentNotes = paymentNotes;
    }
    
    // Apply updates
    await packageItem.update(updates);
    
    res.json({ 
      message: 'Package payment information updated successfully',
      package: packageItem
    });
  } catch (error) {
    console.error('Error updating package payment:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Settle payments with a shop (reset collected money)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.settleShopPayments = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { packageIds, amount } = req.body;
    
    // ---------- NEW LOGIC: Partial settlement by amount ----------
    if (amount !== undefined && packageIds === undefined) {
      const settleAmount = parseFloat(amount);
      if (isNaN(settleAmount) || settleAmount <= 0) {
        return res.status(400).json({ message: 'Invalid settlement amount provided' });
      }

      // Find the shop by id or userId
      let shop = await Shop.findByPk(shopId);
      if (!shop) {
        shop = await Shop.findOne({ where: { userId: shopId } });
      }
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      const currentTotalCollected = parseFloat(shop.TotalCollected || 0);
      if (settleAmount > currentTotalCollected) {
        return res.status(400).json({ message: 'Settlement amount exceeds shop\'s collected balance' });
      }

      const newBalance = currentTotalCollected - settleAmount;
      // Update the value directly via SQL to avoid formatting issues
      await sequelize.query(
        `UPDATE Shops SET TotalCollected = :newBalance WHERE id = :shopId`,
        {
          replacements: { newBalance, shopId: shop.id },
          type: QueryTypes.UPDATE
        }
      );

      await logMoneyTransaction(shop.id, settleAmount, 'TotalCollected', 'decrease', 'Partial settlement');

      return res.json({
        message: `Successfully settled $${settleAmount.toFixed(2)} with shop`,
        amountSettled: settleAmount,
        previousBalance: currentTotalCollected,
        currentBalance: newBalance,
        shopId: shop.id
      });
    }
    // ---------- END NEW LOGIC ----------
    
    if (!packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
      return res.status(400).json({ message: 'Invalid package IDs provided' });
    }
    
    console.log(`Attempting to settle payments for shop ID: ${shopId} with packages: ${JSON.stringify(packageIds)}`);
    
    // Find shop - first check if this is a shop ID or a user ID
    let shop = await Shop.findByPk(shopId);
    
    // If not found directly, try to find by userId
    if (!shop) {
      shop = await Shop.findOne({ where: { userId: shopId } });
    }
    
    if (!shop) {
      console.error(`Shop not found with ID or userId: ${shopId}`);
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Use the actual shop ID from now on
    const actualShopId = shop.id;
    
    // Find packages to settle
    const packages = await Package.findAll({
      where: {
        id: { [Op.in]: packageIds },
        shopId: actualShopId,
        isPaid: true  // Only settle packages that have been paid
      }
    });
    
    console.log(`Found ${packages.length} packages to settle for shop ID ${actualShopId}`);
    
    if (packages.length === 0) {
      return res.status(404).json({ message: 'No valid packages found to settle' });
    }
    
    // Calculate total amount settled
    const totalSettled = packages.reduce((sum, pkg) => {
      return sum + parseFloat(pkg.codAmount || 0);
    }, 0);
    
    // IMPORTANT: Reset the TotalCollected field to 0 in the shop record
    // First, get the current value for logging
    const [currentShopData] = await sequelize.query(
      `SELECT TotalCollected FROM Shops WHERE id = :shopId`,
      {
        replacements: { shopId: shop.id },
        type: QueryTypes.SELECT
      }
    );
    
    const currentTotalCollected = parseFloat(currentShopData.TotalCollected || 0);
    console.log(`Current TotalCollected value for shop ${shop.id}: ${currentTotalCollected}`);
    
    // Use direct SQL query to update the TotalCollected value to 0
    // This avoids any potential issues with Sequelize formatting
    await sequelize.query(
      `UPDATE Shops SET TotalCollected = 0 WHERE id = :shopId`,
      {
        replacements: { shopId: shop.id },
        type: QueryTypes.UPDATE
      }
    );

    await logMoneyTransaction(shop.id, currentTotalCollected, 'TotalCollected', 'decrease', 'Full settlement');
    
    // Verify the update was successful
    const [verifiedShopData] = await sequelize.query(
      `SELECT TotalCollected FROM Shops WHERE id = :shopId`,
      {
        replacements: { shopId: shop.id },
        type: QueryTypes.SELECT
      }
    );
    
    console.log(`Shop ${shop.id} TotalCollected reset in database:`);
    console.log(`Before: $${currentTotalCollected}`);
    console.log(`After: $${verifiedShopData.TotalCollected}`);
    
    // Return success response with verification
    res.json({
      message: `Successfully processed settlement of $${totalSettled.toFixed(2)} for ${packages.length} packages with shop`,
      totalSettled,
      packageCount: packages.length,
      packageIds: packages.map(pkg => pkg.id),
      shopBalanceReset: true,
      previousBalance: currentTotalCollected,
      currentBalance: verifiedShopData.TotalCollected
    });
    
    // Log detailed information about the settlement
    console.log(`Settlement processed for shop ${shop.id} (userId: ${shop.userId})`);
    console.log(`Total settled: $${totalSettled}`);
    console.log(`TotalCollected reset from $${currentTotalCollected} to $0`);
    console.log(`Packages: ${packageIds.join(', ')}`);
  } catch (error) {
    console.error('Error settling shop payments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete associated records based on user role
    if (user.role === 'shop') {
      await Shop.destroy({ where: { userId: id } });
    } else if (user.role === 'driver') {
      await Driver.destroy({ where: { userId: id } });
    }
    
    // Delete the user
    await user.destroy();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMoneyTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      shopId,
      startDate,
      endDate,
      attribute,
      changeType,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search
    } = req.query;

    // Build where clause
    const where = {};
    if (shopId) where.shopId = shopId;
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
        { description: { [Op.like]: `%${search}%` } },
        { '$Shop.businessName$': { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    const { MoneyTransaction, Shop } = require('../models');
    const { Op } = require('sequelize');

    // Validate sort field
    const validSortFields = ['createdAt', 'amount', 'attribute', 'changeType'];
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const actualSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    console.log('Sorting by:', actualSortBy, actualSortOrder);

    const { count, rows } = await MoneyTransaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [[actualSortBy, actualSortOrder]],
      include: [{ 
        model: Shop, 
        attributes: ['businessName'],
        required: false
      }]
    });

    res.json({
      transactions: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      filters: {
        shopId,
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
};
