const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

// Import models
const User = require('./user.model');
const Shop = require('./shop.model');
const Driver = require('./driver.model');

// Define Package model (simplified for now)
const Package = sequelize.define('Package', {
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  packageDescription: {
    type: DataTypes.STRING,
    allowNull: true
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  shopId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Shops',
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
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Drivers',
      key: 'id'
    }
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
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

// Define relationships
User.hasOne(Shop, { foreignKey: 'userId' });
Shop.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Driver, { foreignKey: 'userId' });
Driver.belongsTo(User, { foreignKey: 'userId' });

Shop.hasMany(Package, { foreignKey: 'shopId' });
Package.belongsTo(Shop, { foreignKey: 'shopId' });

Driver.hasMany(Package, { foreignKey: 'driverId' });
Package.belongsTo(Driver, { foreignKey: 'driverId' });

User.hasMany(Package, { foreignKey: 'userId' });
Package.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Shop,
  Driver,
  Package
};
