const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Resolve DB path relative to this script (backend/scripts)
const dbPath = path.resolve(__dirname, '../db/dropin.sqlite');

console.log('[add_rejection_shipping_paid_amount] Using DB at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[add_rejection_shipping_paid_amount] Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('[add_rejection_shipping_paid_amount] Connected to the SQLite database.');
});

function ensureColumn(callback) {
  db.all("PRAGMA table_info('Packages')", (err, rows) => {
    if (err) {
      console.error('[add_rejection_shipping_paid_amount] Failed to inspect table schema:', err.message);
      return callback(err);
    }
    const hasColumn = rows.some((r) => (r && (r.name === 'rejectionShippingPaidAmount')));
    if (hasColumn) {
      console.log('[add_rejection_shipping_paid_amount] Column already exists: rejectionShippingPaidAmount');
      return callback(null, false);
    }

    console.log('[add_rejection_shipping_paid_amount] Adding column: rejectionShippingPaidAmount');
    db.run(
      "ALTER TABLE Packages ADD COLUMN rejectionShippingPaidAmount DECIMAL(10,2) DEFAULT 0.00",
      (alterErr) => {
        if (alterErr) {
          console.error('[add_rejection_shipping_paid_amount] Failed to add column:', alterErr.message);
          return callback(alterErr);
        }
        console.log('[add_rejection_shipping_paid_amount] Column added successfully.');
        return callback(null, true);
      }
    );
  });
}

function backfill(callback) {
  console.log('[add_rejection_shipping_paid_amount] Backfilling NULL values to 0.00...');
  db.run(
    "UPDATE Packages SET rejectionShippingPaidAmount = 0.00 WHERE rejectionShippingPaidAmount IS NULL",
    (err) => {
      if (err) {
        console.error('[add_rejection_shipping_paid_amount] Failed to backfill values:', err.message);
        return callback(err);
      }
      console.log('[add_rejection_shipping_paid_amount] Backfill complete.');
      return callback(null);
    }
  );
}

(function run() {
  ensureColumn((err) => {
    if (err) {
      try { db.close(); } catch (_) {}
      process.exit(1);
      return;
    }
    backfill((bfErr) => {
      try { db.close(); } catch (_) {}
      if (bfErr) {
        process.exit(1);
        return;
      }
      console.log('[add_rejection_shipping_paid_amount] Done.');
      process.exit(0);
    });
  });
})(); 