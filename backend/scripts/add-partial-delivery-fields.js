// Script to add partial-delivery fields to Packages table (standalone)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.resolve(__dirname, '../db/dropin.sqlite');

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Add columns to the Packages table
db.serialize(() => {
  console.log('Adding partial-delivery fields to Packages table...');

  // Add paidAmount column
  db.run(`ALTER TABLE Packages ADD COLUMN paidAmount FLOAT DEFAULT 0`, (err) => {
    if (err) {
      console.log('paidAmount column may already exist or error:', err.message);
    } else {
      console.log('Added paidAmount column');
    }
  });

  // Add deliveredItems column (store JSON as TEXT in SQLite)
  db.run(`ALTER TABLE Packages ADD COLUMN deliveredItems TEXT`, (err) => {
    if (err) {
      console.log('deliveredItems column may already exist or error:', err.message);
    } else {
      console.log('Added deliveredItems column');
    }
  });

  // SQLite does not enforce ENUMs; new statuses are handled at the application layer
  console.log("SQLite note: no DB enum change needed for 'delivered-awaiting-return' and 'delivered-returned'.");

  // Close DB
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database updated and connection closed.');
    }
    process.exit(0);
  });
});


