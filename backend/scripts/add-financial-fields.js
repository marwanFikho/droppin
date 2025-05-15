// Script to add financial fields to Packages table
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

// Add new columns to the Packages table
db.serialize(() => {
  console.log('Adding financial fields to Packages table...');
  
  // We'll add each column individually with appropriate error handling
  
  // Add codAmount column
  db.run(`ALTER TABLE Packages ADD COLUMN codAmount DECIMAL(10,2) DEFAULT 0.00`, (err) => {
    if (err) {
      console.log('codAmount column may already exist or error:', err.message);
    } else {
      console.log('Added codAmount column');
    }
  });
  
  // Add isPaid column
  db.run(`ALTER TABLE Packages ADD COLUMN isPaid BOOLEAN DEFAULT 0`, (err) => {
    if (err) {
      console.log('isPaid column may already exist or error:', err.message);
    } else {
      console.log('Added isPaid column');
    }
  });
  
  // Add paymentDate column
  db.run(`ALTER TABLE Packages ADD COLUMN paymentDate DATETIME`, (err) => {
    if (err) {
      console.log('paymentDate column may already exist or error:', err.message);
    } else {
      console.log('Added paymentDate column');
    }
  });
  
  // Add paymentMethod column
  db.run(`ALTER TABLE Packages ADD COLUMN paymentMethod TEXT`, (err) => {
    if (err) {
      console.log('paymentMethod column may already exist or error:', err.message);
    } else {
      console.log('Added paymentMethod column');
    }
  });
  
  // Add paymentNotes column
  db.run(`ALTER TABLE Packages ADD COLUMN paymentNotes TEXT`, (err) => {
    if (err) {
      console.log('paymentNotes column may already exist or error:', err.message);
    } else {
      console.log('Added paymentNotes column');
    }
    
    // Close the database connection after all operations
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database updated and connection closed.');
      }
      process.exit(0);
    });
  });
});
