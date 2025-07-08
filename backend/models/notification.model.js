const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Notification = sequelize.define('Notification', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userType: {
    type: DataTypes.ENUM('admin', 'shop', 'driver'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

module.exports = Notification; 