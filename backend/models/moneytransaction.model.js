const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const MoneyTransaction = sequelize.define('MoneyTransaction', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  attribute: {
    type: DataTypes.ENUM('ToCollect', 'TotalCollected', 'Revenue', 'DriverCashOnHand'),
    allowNull: false
  },
  changeType: {
    type: DataTypes.ENUM('increase', 'decrease'),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = MoneyTransaction; 