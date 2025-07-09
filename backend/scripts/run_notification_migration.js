const { sequelize } = require('../config/db.config.js');
const migration = require('../migrations/012_create_notifications_table.js');

async function run() {
  try {
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    console.log('Notification table migration ran successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error running notification migration:', err);
    process.exit(1);
  }
}

run();