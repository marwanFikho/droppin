const { Sequelize } = require('sequelize');
const path = require('path');

// Import the migration
const migration = require('./migrations/20250727114955-add-rejected-statuses.js');

// Create Sequelize instance with SQLite configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './db/dropin.sqlite',
  logging: true
});

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Run the migration
    await migration.up(null, Sequelize);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 