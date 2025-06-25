const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Update the status enum to include new statuses
    await queryInterface.changeColumn('Packages', 'status', {
      type: DataTypes.ENUM(
        'awaiting_schedule',
        'awaiting_pickup',
        'scheduled_for_pickup',
        'pending',
        'assigned',
        'pickedup',
        'in-transit',
        'delivered',
        'cancelled',
        'cancelled-awaiting-return',
        'cancelled-returned'
      ),
      defaultValue: 'awaiting_schedule'
    });

    console.log('Updated package status enum successfully');
    return true;
  } catch (error) {
    console.error('Error updating package status enum:', error);
    return false;
  }
}

async function down() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Revert status enum to previous values
    await queryInterface.changeColumn('Packages', 'status', {
      type: DataTypes.ENUM(
        'awaiting_schedule',
        'awaiting_pickup',
        'scheduled_for_pickup',
        'pending',
        'assigned',
        'pickedup',
        'in-transit',
        'delivered',
        'cancelled',
        'returned'
      ),
      defaultValue: 'awaiting_schedule'
    });

    console.log('Reverted package status enum successfully');
    return true;
  } catch (error) {
    console.error('Error reverting package status enum:', error);
    return false;
  }
}

module.exports = { up, down }; 