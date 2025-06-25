const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    await sequelize.getQueryInterface().createTable('Pickups', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
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
    console.log('Pickups table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating Pickups table:', error);
    return false;
  }
}

async function down() {
  try {
    await sequelize.getQueryInterface().dropTable('Pickups');
    console.log('Pickups table dropped successfully');
    return true;
  } catch (error) {
    console.error('Error dropping Pickups table:', error);
    return false;
  }
}

module.exports = { up, down }; 