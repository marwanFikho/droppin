// fix_package_shopid_cascade.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Update this path if your SQLite DB is elsewhere
const dbPath = path.join(__dirname, '../db/dropin.sqlite'); // updated to correct DB file location
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: console.log,
});

async function run() {
  const tableName = 'Packages';
  const tempTable = 'Packages_temp';

  try {
    // 1. Create new table with ON DELETE CASCADE
    await sequelize.query(`
      CREATE TABLE ${tempTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shopId INTEGER NOT NULL,
        pickupId INTEGER,
        driverId INTEGER,
        userId INTEGER,
        trackingNumber VARCHAR(255) UNIQUE NOT NULL,
        packageDescription VARCHAR(255) NOT NULL,
        weight FLOAT NOT NULL,
        dimensions VARCHAR(255),
        status VARCHAR(32) DEFAULT 'awaiting_schedule',
        pickupContactName VARCHAR(255),
        pickupContactPhone VARCHAR(255),
        pickupAddress VARCHAR(255),
        deliveryContactName VARCHAR(255),
        deliveryContactPhone VARCHAR(255),
        deliveryAddress VARCHAR(255) NOT NULL,
        schedulePickupTime VARCHAR(255) NOT NULL,
        estimatedDeliveryTime VARCHAR(255),
        actualPickupTime DATETIME,
        actualDeliveryTime DATETIME,
        priority VARCHAR(32) DEFAULT 'normal',
        paymentStatus VARCHAR(32) DEFAULT 'pending',
        codAmount FLOAT DEFAULT 0,
        deliveryCost FLOAT DEFAULT 0,
        paymentMethod VARCHAR(255),
        paymentNotes TEXT,
        isPaid BOOLEAN DEFAULT 0,
        paymentDate VARCHAR(255),
        notes TEXT,
        shopNotes TEXT,
        signature TEXT,
        deliveryPhotos TEXT,
        statusHistory TEXT,
        itemsNo INTEGER,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        FOREIGN KEY (shopId) REFERENCES Shops(id) ON DELETE CASCADE,
        FOREIGN KEY (pickupId) REFERENCES Pickups(id),
        FOREIGN KEY (driverId) REFERENCES Drivers(id),
        FOREIGN KEY (userId) REFERENCES Users(id)
      );
    `);

    // 2. Copy data
    await sequelize.query(`
      INSERT INTO ${tempTable} (
        id, shopId, pickupId, driverId, userId, trackingNumber, packageDescription, weight, dimensions, status, pickupContactName, pickupContactPhone, pickupAddress, deliveryContactName, deliveryContactPhone, deliveryAddress, schedulePickupTime, estimatedDeliveryTime, actualPickupTime, actualDeliveryTime, priority, paymentStatus, codAmount, deliveryCost, paymentMethod, paymentNotes, isPaid, paymentDate, notes, shopNotes, signature, deliveryPhotos, statusHistory, itemsNo, createdAt, updatedAt
      )
      SELECT id, shopId, pickupId, driverId, userId, trackingNumber, packageDescription, weight, dimensions, status, pickupContactName, pickupContactPhone, pickupAddress, deliveryContactName, deliveryContactPhone, deliveryAddress, schedulePickupTime, estimatedDeliveryTime, actualPickupTime, actualDeliveryTime, priority, paymentStatus, codAmount, deliveryCost, paymentMethod, paymentNotes, isPaid, paymentDate, notes, shopNotes, signature, deliveryPhotos, statusHistory, itemsNo, createdAt, updatedAt
      FROM ${tableName};
    `);

    // Disable foreign key checks temporarily
    await sequelize.query('PRAGMA foreign_keys = OFF;');

    // 3. Drop old table
    await sequelize.query(`DROP TABLE ${tableName};`);
    // 4. Rename new table
    await sequelize.query(`ALTER TABLE ${tempTable} RENAME TO ${tableName};`);

    // Re-enable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = ON;');

    console.log('Packages table updated with ON DELETE CASCADE on shopId!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sequelize.close();
  }
}

run(); 