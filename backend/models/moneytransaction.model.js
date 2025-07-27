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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  attribute: {
    type: DataTypes.ENUM('ToCollect', 'TotalCollected', 'Revenue'),
    allowNull: false
  },
  changeType: {
    type: DataTypes.ENUM('increase', 'decrease'),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = MoneyTransaction; 