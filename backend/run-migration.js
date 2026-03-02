const { Sequelize } = require('sequelize');
const { sequelize } = require('./config/db.config');

// Import the migration
const migration = require('./migrations/20250727114955-add-rejected-statuses.js');

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 