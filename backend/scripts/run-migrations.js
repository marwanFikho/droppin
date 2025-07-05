const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/db.config');

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Get already executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM migrations'
    );
    const executedMigrationNames = executedMigrations.map(m => m.name);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        const migration = require(path.join(migrationsDir, file));
        
        // Run the migration
        const result = await migration.up();
        
        if (result) {
          // Record the migration
          await sequelize.query(
            'INSERT INTO migrations (name) VALUES (?)',
            {
              replacements: [file]
            }
          );
          console.log(`Migration ${file} completed successfully`);
        } else {
          console.error(`Migration ${file} failed`);
          process.exit(1);
        }
      } else {
        console.log(`Migration ${file} already executed, skipping`);
      }
    }

    console.log('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
