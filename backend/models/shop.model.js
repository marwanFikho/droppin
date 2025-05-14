const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Shop = sequelize.define('Shop', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Making userId optional since we're not creating users for shops
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
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Contact information fields
  contactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  // Make Sequelize less strict about field validation
  paranoid: false,
  // Tell Sequelize to ignore fields in the database that aren't in the model
  underscored: false
});

module.exports = Shop;
