const { sequelize } = require('../config/db.config');

// Import models
const User = require('./user.model');
const Shop = require('./shop.model');
const Driver = require('./driver.model');
const Package = require('./package.model');
const Pickup = require('./pickup.model');
const MoneyTransaction = require('./moneytransaction.model');
const Notification = require('./notification.model');
const Item = require('./item.model');

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

// Package-Item relationship
Package.hasMany(Item, { foreignKey: 'packageId' });
Item.belongsTo(Package, { foreignKey: 'packageId' });

Shop.hasMany(Pickup, { foreignKey: 'shopId' });
Pickup.belongsTo(Shop, { foreignKey: 'shopId' });

Shop.hasMany(MoneyTransaction, { foreignKey: 'shopId' });
MoneyTransaction.belongsTo(Shop, { foreignKey: 'shopId' });

Driver.hasMany(MoneyTransaction, { foreignKey: 'driverId' });
MoneyTransaction.belongsTo(Driver, { foreignKey: 'driverId' });

Driver.hasMany(Pickup, { foreignKey: 'driverId' });
Pickup.belongsTo(Driver, { foreignKey: 'driverId' });

const PickupPackages = sequelize.define('PickupPackages', {}, { timestamps: true });
Pickup.belongsToMany(Package, { through: PickupPackages, foreignKey: 'pickupId' });
Package.belongsToMany(Pickup, { through: PickupPackages, foreignKey: 'packageId' });

module.exports = {
  sequelize,
  User,
  Shop,
  Driver,
  Package,
  Pickup,
  MoneyTransaction,
  PickupPackages,
  Notification,
  Item
};
