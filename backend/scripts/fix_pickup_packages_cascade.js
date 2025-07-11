// fix_pickup_packages_cascade.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Path to your SQLite DB
const dbPath = path.join(__dirname, '../db/dropin.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: console.log,
});

async function run() {
  const tableName = 'PickupPackages';
  const tempTable = 'PickupPackages_temp';

  try {
    // 1. Create new table with ON DELETE CASCADE for packageId
    await sequelize.query(`
      CREATE TABLE ${tempTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pickupId INTEGER NOT NULL,
        packageId INTEGER NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (pickupId) REFERENCES Pickups(id),
        FOREIGN KEY (packageId) REFERENCES Packages(id) ON DELETE CASCADE
      );
    `);

    // 2. Copy data
    await sequelize.query(`
      INSERT INTO ${tempTable} (id, pickupId, packageId, createdAt, updatedAt)
      SELECT id, pickupId, packageId, createdAt, updatedAt FROM ${tableName};
    `);

    // 3. Drop old table (disable foreign key checks temporarily)
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.query(`DROP TABLE ${tableName};`);
    await sequelize.query(`ALTER TABLE ${tempTable} RENAME TO ${tableName};`);
    await sequelize.query('PRAGMA foreign_keys = ON;');

    // 4. Re-add unique constraint for (pickupId, packageId)
    await sequelize.query(`
      CREATE UNIQUE INDEX unique_pickup_package_pair ON ${tableName} (pickupId, packageId);
    `);

    console.log('PickupPackages table updated with ON DELETE CASCADE on packageId!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sequelize.close();
  }
}

run();