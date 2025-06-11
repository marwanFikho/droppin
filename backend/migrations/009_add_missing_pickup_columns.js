const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Add actualPickupTime column to Pickups table
    await queryInterface.addColumn('Pickups', 'actualPickupTime', {
      type: DataTypes.DATE,
      allowNull: true
    });

    // Add notes column to Pickups table
    await queryInterface.addColumn('Pickups', 'notes', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    console.log('Added missing columns to Pickups table successfully');
    return true;
  } catch (error) {
    console.error('Error adding missing columns to Pickups table:', error);
    return false;
  }
}

async function down() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Remove the added columns
    await queryInterface.removeColumn('Pickups', 'actualPickupTime');
    await queryInterface.removeColumn('Pickups', 'notes');

    console.log('Removed added columns from Pickups table successfully');
    return true;
  } catch (error) {
    console.error('Error removing columns from Pickups table:', error);
    return false;
  }
}

module.exports = { up, down }; 