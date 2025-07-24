// Standalone migration script to add isShopifySent to Packages
const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function run() {
  try {
    await sequelize.getQueryInterface().addColumn('Packages', 'isShopifySent', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    });
    console.log('Migration successful: isShopifySent column added to Packages table.');
    process.exit(0);
  } catch (error) {
    if (error.message && error.message.includes('duplicate column name')) {
      console.log('Column isShopifySent already exists.');
      process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run(); 