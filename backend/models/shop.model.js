const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Shop = sequelize.define('Shop', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  businessName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  businessType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPersonName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPersonPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPersonEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ToCollect: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  TotalCollected: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  settelled: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false
  },
  shippingFees: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  shownShippingFees: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null
  },
  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = Shop;
