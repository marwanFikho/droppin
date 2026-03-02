const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch (error) {
    return false;
  }
}

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  if (!(await tableExists(queryInterface, 'Users'))) {
    await queryInterface.createTable('Users', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM('user', 'shop', 'driver', 'admin'), defaultValue: 'user' },
      street: { type: DataTypes.STRING, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      state: { type: DataTypes.STRING, allowNull: true },
      zipCode: { type: DataTypes.STRING, allowNull: true },
      country: { type: DataTypes.STRING, allowNull: true },
      isApproved: { type: DataTypes.BOOLEAN, defaultValue: false },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      lang: { type: DataTypes.STRING, allowNull: false, defaultValue: 'en' },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'Shops'))) {
    await queryInterface.createTable('Shops', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      businessName: { type: DataTypes.STRING, allowNull: false },
      businessType: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      logo: { type: DataTypes.STRING, allowNull: true },
      registrationNumber: { type: DataTypes.STRING, allowNull: true },
      taxId: { type: DataTypes.STRING, allowNull: true },
      contactPersonName: { type: DataTypes.STRING, allowNull: true },
      contactPersonPhone: { type: DataTypes.STRING, allowNull: true },
      contactPersonEmail: { type: DataTypes.STRING, allowNull: true },
      isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      ToCollect: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
      TotalCollected: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
      settelled: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
      shippingFees: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0.0 },
      shownShippingFees: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null },
      isHiddenInAdminMenu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      apiKey: { type: DataTypes.STRING, allowNull: true, unique: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'Drivers'))) {
    await queryInterface.createTable('Drivers', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      vehicleType: { type: DataTypes.ENUM('car', 'motorcycle', 'bicycle', 'van', 'truck'), allowNull: false },
      licensePlate: { type: DataTypes.STRING, allowNull: true },
      model: { type: DataTypes.STRING, allowNull: true },
      color: { type: DataTypes.STRING, allowNull: true },
      driverLicense: { type: DataTypes.STRING, allowNull: true },
      isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
      locationUpdatedAt: { type: DataTypes.DATE, allowNull: true },
      rating: { type: DataTypes.FLOAT, defaultValue: 0 },
      totalDeliveries: { type: DataTypes.INTEGER, defaultValue: 0 },
      totalAssigned: { type: DataTypes.INTEGER, defaultValue: 0 },
      totalCancelled: { type: DataTypes.INTEGER, defaultValue: 0 },
      assignedToday: { type: DataTypes.INTEGER, defaultValue: 0 },
      activeAssign: { type: DataTypes.INTEGER, defaultValue: 0 },
      isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      workingArea: { type: DataTypes.STRING, allowNull: true },
      cashOnHand: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'Pickups'))) {
    await queryInterface.createTable('Pickups', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Shops', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      scheduledTime: { type: DataTypes.DATE, allowNull: false },
      pickupAddress: { type: DataTypes.STRING, allowNull: false },
      driverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Drivers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      status: {
        type: DataTypes.ENUM('pending', 'scheduled', 'picked_up', 'in_storage', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      actualPickupTime: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'Pickups_backup'))) {
    await queryInterface.createTable('Pickups_backup', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Shops', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      scheduledTime: { type: DataTypes.DATE, allowNull: false },
      pickupAddress: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'scheduled', 'picked_up', 'in_storage', 'completed', 'cancelled'),
        defaultValue: 'pending'
      },
      actualPickupTime: { type: DataTypes.DATE, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'Packages'))) {
    await queryInterface.createTable('Packages', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Shops', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      pickupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Pickups', key: 'id' }
      },
      driverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Drivers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      trackingNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
      type: { type: DataTypes.ENUM('new', 'return', 'exchange'), allowNull: false, defaultValue: 'new' },
      packageDescription: { type: DataTypes.STRING, allowNull: false },
      weight: { type: DataTypes.FLOAT, allowNull: false },
      dimensions: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM(
          'awaiting_schedule',
          'awaiting_pickup',
          'scheduled_for_pickup',
          'pending',
          'assigned',
          'pickedup',
          'in-transit',
          'delivered',
          'delivered-awaiting-return',
          'delivered-returned',
          'cancelled',
          'cancelled-awaiting-return',
          'cancelled-returned',
          'rejected',
          'rejected-awaiting-return',
          'rejected-returned',
          'return-requested',
          'return-in-transit',
          'return-pending',
          'return-completed',
          'exchange-awaiting-schedule',
          'exchange-awaiting-pickup',
          'exchange-in-process',
          'exchange-in-transit',
          'exchange-awaiting-return',
          'exchange-returned',
          'exchange-cancelled'
        ),
        defaultValue: 'awaiting_schedule'
      },
      pickupContactName: { type: DataTypes.STRING, allowNull: true },
      pickupContactPhone: { type: DataTypes.STRING, allowNull: true },
      pickupAddress: { type: DataTypes.STRING, allowNull: true },
      deliveryContactName: { type: DataTypes.STRING, allowNull: true },
      deliveryContactPhone: { type: DataTypes.STRING, allowNull: true },
      deliveryAddress: { type: DataTypes.STRING, allowNull: false },
      schedulePickupTime: { type: DataTypes.STRING, allowNull: false },
      estimatedDeliveryTime: { type: DataTypes.STRING, allowNull: true },
      actualPickupTime: { type: DataTypes.DATE, allowNull: true },
      actualDeliveryTime: { type: DataTypes.DATE, allowNull: true },
      priority: { type: DataTypes.ENUM('normal', 'express', 'same-day'), defaultValue: 'normal' },
      paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'failed'), defaultValue: 'pending' },
      codAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
      deliveryCost: { type: DataTypes.FLOAT, defaultValue: 0 },
      shownDeliveryCost: { type: DataTypes.FLOAT, defaultValue: null },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
      paymentNotes: { type: DataTypes.TEXT, allowNull: true },
      isPaid: { type: DataTypes.BOOLEAN, defaultValue: false },
      paymentDate: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
      shopNotes: { type: DataTypes.TEXT, allowNull: true },
      signature: { type: DataTypes.JSON, defaultValue: null },
      deliveryPhotos: { type: DataTypes.JSON, defaultValue: null },
      statusHistory: { type: DataTypes.JSON, defaultValue: [] },
      itemsNo: { type: DataTypes.INTEGER, allowNull: true },
      shopifyOrderId: { type: DataTypes.STRING, allowNull: true },
      shopifyOrderName: { type: DataTypes.STRING, allowNull: true },
      returnDetails: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
      returnRefundAmount: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
      paidAmount: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
      deliveredItems: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
      exchangeDetails: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
      rejectionShippingPaidAmount: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
      rejectionDeductShipping: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'MoneyTransactions'))) {
    await queryInterface.createTable('MoneyTransactions', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      shopId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Shops', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      driverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Drivers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      attribute: {
        type: DataTypes.ENUM('ToCollect', 'TotalCollected', 'Revenue', 'DriverCashOnHand'),
        allowNull: false
      },
      changeType: { type: DataTypes.ENUM('increase', 'decrease'), allowNull: false },
      description: { type: DataTypes.STRING, allowNull: true },
      currentAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'Notifications'))) {
    await queryInterface.createTable('Notifications', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.INTEGER, allowNull: true },
      userType: { type: DataTypes.ENUM('admin', 'shop', 'driver'), allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      data: { type: DataTypes.JSON, allowNull: true },
      isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'Items'))) {
    await queryInterface.createTable('Items', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      packageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Packages', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      description: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      codAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  }

  if (!(await tableExists(queryInterface, 'PickupPackages'))) {
    await queryInterface.createTable('PickupPackages', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      pickupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Pickups', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      packageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Packages', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex('PickupPackages', ['pickupId', 'packageId'], {
      name: 'unique_pickup_package_pair',
      unique: true
    });
  }

  if (!(await tableExists(queryInterface, 'Stats'))) {
    await queryInterface.createTable('Stats', {
      id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      profit: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.0 },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
    });
  }

  await sequelize.query(`
    INSERT INTO Stats (profit, createdAt, updatedAt)
    SELECT 0, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM Stats)
  `);

  try { await queryInterface.addIndex('Packages', ['status'], { name: 'idx_packages_status' }); } catch (e) {}
  try { await queryInterface.addIndex('Packages', ['shopId'], { name: 'idx_packages_shopId' }); } catch (e) {}
  try { await queryInterface.addIndex('Packages', ['driverId'], { name: 'idx_packages_driverId' }); } catch (e) {}
  try { await queryInterface.addIndex('Packages', ['createdAt'], { name: 'idx_packages_createdAt' }); } catch (e) {}
  try { await queryInterface.addIndex('Packages', ['actualDeliveryTime'], { name: 'idx_packages_actualDeliveryTime' }); } catch (e) {}

  return true;
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  try { await queryInterface.dropTable('PickupPackages'); } catch (e) {}
  try { await queryInterface.dropTable('Pickups_backup'); } catch (e) {}
  try { await queryInterface.dropTable('Items'); } catch (e) {}
  try { await queryInterface.dropTable('Notifications'); } catch (e) {}
  try { await queryInterface.dropTable('MoneyTransactions'); } catch (e) {}
  try { await queryInterface.dropTable('Packages'); } catch (e) {}
  try { await queryInterface.dropTable('Pickups'); } catch (e) {}
  try { await queryInterface.dropTable('Drivers'); } catch (e) {}
  try { await queryInterface.dropTable('Shops'); } catch (e) {}
  try { await queryInterface.dropTable('Users'); } catch (e) {}
  try { await queryInterface.dropTable('Stats'); } catch (e) {}

  return true;
}

module.exports = { up, down };
