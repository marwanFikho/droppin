// Script to sync the database with model changes
const { sequelize } = require('../config/db.config');
const db = require('../models');

async function syncDatabase() {
  try {
    console.log('Starting database synchronization...');
    
    // Alter tables to add new columns but keep existing data
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
}

// Run the sync function
syncDatabase();
