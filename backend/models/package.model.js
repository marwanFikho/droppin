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
  pickupId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Pickups',
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
  type: {
    type: DataTypes.ENUM('new', 'return', 'exchange'),
    allowNull: false,
    defaultValue: 'new'
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
    type: DataTypes.ENUM(
      'awaiting_schedule',
      'awaiting_pickup',
      'scheduled_for_pickup',
      'pending',
      'assigned',
      'pickedup',
      'in-transit',
      'delivered',
      'cancelled',
      'cancelled-awaiting-return',
      'cancelled-returned',
      'rejected',
      'rejected-awaiting-return',
      'rejected-returned'
    ),
    defaultValue: 'awaiting_schedule'
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
    type: DataTypes.STRING,
    allowNull: false
  },
  estimatedDeliveryTime: {
    type: DataTypes.STRING,
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
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  deliveryCost: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  shownDeliveryCost: {
    type: DataTypes.FLOAT,
    defaultValue: null
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paymentDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.JSON, // Array of note objects: { text, createdAt, author }
    allowNull: true
  },
  shopNotes: {
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
    defaultValue: []
  },
  itemsNo: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  shopifyOrderId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false
  },
}, {
  hooks: {
    beforeCreate: (package) => {
      console.log('beforeCreate hook called for Package');
      if (!package.trackingNumber) {
        const prefix = 'DP'; // Droppin prefix
        const timestamp = Math.floor(Date.now() / 1000).toString(16); // Unix timestamp in hex
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        package.trackingNumber = `${prefix}${timestamp}${random}`.toUpperCase();
        console.log('Generated tracking number:', package.trackingNumber);
      }
    }
  },
  timestamps: true
});

module.exports = Package;
