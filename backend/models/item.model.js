const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Item = sequelize.define('Item', {
  packageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Packages',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  codAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = Item; 