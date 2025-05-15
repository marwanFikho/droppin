const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

// Import models
const User = require('./user.model');
const Shop = require('./shop.model');
const Driver = require('./driver.model');

// Define Package model (simplified for now)
const Package = sequelize.define('Package', {

  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  packageDescription: {
    type: DataTypes.STRING,
    allowNull: true
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shops',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Drivers',
      key: 'id'
    }
  },
  pickupContactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pickupContactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pickupAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryContactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryContactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deliveryAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  schedulePickupTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedDeliveryTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualPickupTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualDeliveryTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryFee: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.ENUM('normal', 'express', 'same-day'),
    defaultValue: 'normal'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  signature: {
    type: DataTypes.JSON,
    defaultValue: null
  },
  deliveryPhotos: {
    type: DataTypes.JSON,
    defaultValue: null
  },
  statusHistory: {
    type: DataTypes.JSON,
    defaultValue: null
  },
  // Financial tracking fields
  codAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Cash on delivery amount to be collected from recipient'
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the COD amount has been collected'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the payment was collected'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'other'),
    allowNull: true,
    comment: 'Method of payment collection'
  },
  paymentNotes: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Additional notes about the payment'
  }
}, {
  timestamps: true
});

// Define relationships
User.hasOne(Shop, { foreignKey: 'userId' });
Shop.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Driver, { foreignKey: 'userId' });
Driver.belongsTo(User, { foreignKey: 'userId' });

Shop.hasMany(Package, { foreignKey: 'shopId' });
Package.belongsTo(Shop, { foreignKey: 'shopId' });

Driver.hasMany(Package, { foreignKey: 'driverId' });
Package.belongsTo(Driver, { foreignKey: 'driverId' });

User.hasMany(Package, { foreignKey: 'userId' });
Package.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Shop,
  Driver,
  Package
};
