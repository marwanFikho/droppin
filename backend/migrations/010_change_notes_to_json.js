const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function columnExists(queryInterface, tableName, columnName) {
  const tableInfo = await queryInterface.sequelize.query(`PRAGMA table_info(${tableName});`);
  return tableInfo[0].some(col => col.name === columnName);
}

async function up() {
  const queryInterface = sequelize.getQueryInterface();
  // Remove the old notes column if it exists
  if (await columnExists(queryInterface, 'Packages', 'notes')) {
    await queryInterface.removeColumn('Packages', 'notes');
  }
  // Add the new notes column as JSON
  await queryInterface.addColumn('Packages', 'notes', {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  });
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();
  // Remove the JSON notes column if it exists
  if (await columnExists(queryInterface, 'Packages', 'notes')) {
    await queryInterface.removeColumn('Packages', 'notes');
  }
  // Add back the notes column as TEXT
  await queryInterface.addColumn('Packages', 'notes', {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null
  });
}

module.exports = { up, down }; 