const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function columnExists(queryInterface, tableName, columnName) {
  const tableInfo = await queryInterface.sequelize.query(`PRAGMA table_info(${tableName});`);
  return tableInfo[0].some(col => col.name === columnName);
}

async function up() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    // Add actualPickupTime column if it doesn't exist
    if (!(await columnExists(queryInterface, 'Pickups', 'actualPickupTime'))){
    await queryInterface.addColumn('Pickups', 'actualPickupTime', {
      type: DataTypes.DATE,
      allowNull: true
    });
    }
    // Add notes column if it doesn't exist
    if (!(await columnExists(queryInterface, 'Pickups', 'notes'))){
    await queryInterface.addColumn('Pickups', 'notes', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    }
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
    // Remove columns if they exist
    if (await columnExists(queryInterface, 'Pickups', 'actualPickupTime')) {
    await queryInterface.removeColumn('Pickups', 'actualPickupTime');
    }
    if (await columnExists(queryInterface, 'Pickups', 'notes')) {
    await queryInterface.removeColumn('Pickups', 'notes');
    }
    console.log('Removed columns from Pickups table successfully');
    return true;
  } catch (error) {
    console.error('Error removing columns from Pickups table:', error);
    return false;
  }
}

module.exports = { up, down }; 