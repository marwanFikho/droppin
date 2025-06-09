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
  status: {
    type: DataTypes.ENUM('pending', 'scheduled', 'completed', 'cancelled'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true
});

module.exports = Pickup; 