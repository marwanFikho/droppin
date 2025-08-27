const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Driver = sequelize.define('Driver', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  vehicleType: {
    type: DataTypes.ENUM('car', 'motorcycle', 'bicycle', 'van', 'truck'),
    allowNull: false
  },
  licensePlate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  driverLicense: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  locationUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  totalDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalAssigned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalCancelled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  assignedToday: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  activeAssign: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  workingArea: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'The area where the driver works (set by admin)'
  },
  cashOnHand: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Accumulated COD cash currently held by the driver'
  }
}, {
  timestamps: true
});

module.exports = Driver;
