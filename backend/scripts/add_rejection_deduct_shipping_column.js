#!/usr/bin/env node

const { sequelize } = require('../config/db.config');

(async () => {
  console.log('=== Adding column rejectionDeductShipping to Packages table ===');
  try {
    await sequelize.authenticate();

    // Check if column already exists
    const [columns] = await sequelize.query("PRAGMA table_info('Packages');");
    const hasColumn = Array.isArray(columns) && columns.some(col => String(col.name) === 'rejectionDeductShipping');
    if (hasColumn) {
      console.log('Column rejectionDeductShipping already exists. Nothing to do.');
      await sequelize.close();
      return;
    }

    // Apply ALTER TABLE and backfill within a transaction
    await sequelize.transaction(async (t) => {
      console.log('Adding column...');
      // SQLite boolean is stored as INTEGER (0/1)
      await sequelize.query(
        'ALTER TABLE "Packages" ADD COLUMN "rejectionDeductShipping" INTEGER DEFAULT 1;',
        { transaction: t }
      );

      console.log('Backfilling existing rows to 1 (true)...');
      await sequelize.query(
        'UPDATE "Packages" SET "rejectionDeductShipping" = 1 WHERE "rejectionDeductShipping" IS NULL;',
        { transaction: t }
      );
    });

    console.log('Success: Column rejectionDeductShipping added and initialized.');
  } catch (err) {
    console.error('Error adding column rejectionDeductShipping:', err.message || err);
    process.exitCode = 1;
  } finally {
    try { await sequelize.close(); } catch {}
  }
})(); 