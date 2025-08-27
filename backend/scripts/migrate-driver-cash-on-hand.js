const { sequelize } = require('../config/db.config');

async function columnExists(tableName, columnName) {
  const [rows] = await sequelize.query(`PRAGMA table_info(${tableName});`);
  return Array.isArray(rows) && rows.some((r) => String(r.name).toLowerCase() === String(columnName).toLowerCase());
}

async function tableExists(tableName) {
  const [rows] = await sequelize.query(`SELECT name FROM sqlite_master WHERE type='table' AND name=:t`, {
    replacements: { t: tableName },
  });
  return Array.isArray(rows) && rows.length > 0;
}

async function run() {
  try {
    console.log('Starting driver cash-on-hand migration...');

    // Ensure Drivers table exists
    if (!(await tableExists('Drivers'))) {
      console.log('Drivers table not found. Skipping driver cashOnHand migration.');
    } else {
      const hasCash = await columnExists('Drivers', 'cashOnHand');
      if (!hasCash) {
        console.log('Adding cashOnHand column to Drivers...');
        await sequelize.getQueryInterface().addColumn('Drivers', 'cashOnHand', {
          type: sequelize.Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00,
          comment: 'Accumulated COD cash currently held by the driver',
        });
        console.log('Added Drivers.cashOnHand');
      } else {
        console.log('Drivers.cashOnHand already exists. Skipping.');
      }
    }

    // Ensure MoneyTransactions table updates
    if (!(await tableExists('MoneyTransactions'))) {
      console.log('MoneyTransactions table not found. Skipping driverId addition.');
    } else {
      const hasDriverId = await columnExists('MoneyTransactions', 'driverId');
      if (!hasDriverId) {
        console.log('Adding driverId column to MoneyTransactions...');
        await sequelize.getQueryInterface().addColumn('MoneyTransactions', 'driverId', {
          type: sequelize.Sequelize.INTEGER,
          allowNull: true,
        });
        console.log('Added MoneyTransactions.driverId');
      } else {
        console.log('MoneyTransactions.driverId already exists. Skipping.');
      }
      // Note: SQLite does not enforce ENUM types. No action needed to support new attribute values.
    }

    console.log('Driver cash-on-hand migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();


