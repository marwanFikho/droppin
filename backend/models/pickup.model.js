const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Pickup = sequelize.define('Pickup', {
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Shops',
      key: 'id'
    }
  },
  scheduledTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  pickupAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Drivers',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'scheduled', 'picked_up', 'in_storage', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  actualPickupTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Pickup; 