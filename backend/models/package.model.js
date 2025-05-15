const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Package = sequelize.define('Package', {
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Shops',
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
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  trackingNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  packageDescription: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned'),
    defaultValue: 'pending'
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
    allowNull: false
  },
  schedulePickupTime: {
    type: DataTypes.DATE,
    allowNull: false
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
  priority: {
    type: DataTypes.ENUM('normal', 'express', 'same-day'),
    defaultValue: 'normal'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending'
  },
  codAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // No additional fields - model must match database exactly
}, {
  hooks: {
    beforeCreate: (package) => {
      if (!package.trackingNumber) {
        const prefix = 'DP'; // Droppin prefix
        const timestamp = Math.floor(Date.now() / 1000).toString(16); // Unix timestamp in hex
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        package.trackingNumber = `${prefix}${timestamp}${random}`.toUpperCase();
      }
    }
  },
  timestamps: true
});

module.exports = Package;
