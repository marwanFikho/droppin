const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    await sequelize.getQueryInterface().createTable('PickupPackages', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pickupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Pickups',
          key: 'id'
        }
      },
      packageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Packages',
          key: 'id'
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    // Add unique constraint for (pickupId, packageId)
    await sequelize.getQueryInterface().addConstraint('PickupPackages', {
      fields: ['pickupId', 'packageId'],
      type: 'unique',
      name: 'unique_pickup_package_pair'
    });
    console.log('PickupPackages table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating PickupPackages table:', error);
    return false;
  }
}

async function down() {
  try {
    await sequelize.getQueryInterface().dropTable('PickupPackages');
    console.log('PickupPackages table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping PickupPackages table:', error);
    return false;
  }
}

module.exports = { up, down }; 