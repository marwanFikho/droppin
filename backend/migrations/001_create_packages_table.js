const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    // Create packages table
    await sequelize.getQueryInterface().createTable('Packages', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
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
      schedulePickupTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      estimatedDeliveryTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      actualPickupTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      actualDeliveryTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      deliveryFee: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      priority: {
        type: DataTypes.ENUM('normal', 'express', 'same-day'),
        defaultValue: 'normal'
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      signature: {
        type: DataTypes.JSON,
        defaultValue: null
      },
      deliveryPhotos: {
        type: DataTypes.JSON,
        defaultValue: null
      },
      statusHistory: {
        type: DataTypes.JSON,
        defaultValue: null
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

    console.log('Packages table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating packages table:', error);
    return false;
  }
}

async function down() {
  try {
    await sequelize.getQueryInterface().dropTable('Packages');
    console.log('Packages table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping packages table:', error);
    return false;
  }
}

module.exports = {
  up,
  down
};
