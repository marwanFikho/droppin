const { sequelize } = require('../config/db.config');

// Import models
const User = require('./user.model');
const Shop = require('./shop.model');
const Driver = require('./driver.model');
const Package = require('./package.model');

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
