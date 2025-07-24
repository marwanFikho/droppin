// Standalone migration script to remove isShopifySent from Packages
const { sequelize } = require('../config/db.config');

async function run() {
  try {
    await sequelize.getQueryInterface().removeColumn('Packages', 'isShopifySent');
    console.log('Migration successful: isShopifySent column removed from Packages table.');
    process.exit(0);
  } catch (error) {
    if (error.message && error.message.includes('no such column')) {
      console.log('Column isShopifySent does not exist.');
      process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run(); 