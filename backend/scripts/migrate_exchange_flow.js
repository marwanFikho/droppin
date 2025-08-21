#!/usr/bin/env node
const path = require('path');
const { sequelize } = require('../config/db.config');

(async () => {
  let foreignKeysToggled = false;
  try {
    // Ensure DB connection
    await sequelize.authenticate();
    console.log('[migrate_exchange_flow] DB connection OK');

    // Import the migration module directly
    const migration = require('../migrations/20250821000100_add_exchange_statuses_and_field');

    const direction = (process.argv[2] || 'up').toLowerCase();
    if (!['up', 'down'].includes(direction)) {
      console.error('Usage: node backend/scripts/migrate_exchange_flow.js [up|down]');
      process.exit(1);
    }

    const dialect = sequelize.getDialect();
    console.log(`[migrate_exchange_flow] Dialect: ${dialect}`);

    // On SQLite, ALTER COLUMN on ENUM may rebuild the table which can trigger FK cascades.
    // Temporarily disable FK enforcement to prevent cascading deletes of Items.
    if (dialect === 'sqlite') {
      await sequelize.query('PRAGMA foreign_keys=OFF');
      foreignKeysToggled = true;
      console.log('[migrate_exchange_flow] Disabled SQLite foreign_keys for safe ALTER');
    }

    console.log(`[migrate_exchange_flow] Running ${direction}...`);
    const ok = await migration[direction]();
    if (!ok) {
      console.error(`[migrate_exchange_flow] ${direction} failed`);
      process.exit(1);
    }

    console.log(`[migrate_exchange_flow] ${direction} completed successfully`);
    process.exit(0);
  } catch (err) {
    console.error('[migrate_exchange_flow] Error:', err);
    process.exit(1);
  } finally {
    try {
      // Re-enable FKs if we disabled them
      if (foreignKeysToggled) {
        await sequelize.query('PRAGMA foreign_keys=ON');
        console.log('[migrate_exchange_flow] Re-enabled SQLite foreign_keys');
      }
    } catch {}
    try { await sequelize.close(); } catch {}
  }
})(); 