const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const { sequelize } = require('../config/db.config');

async function runMigrations() {
  try {
    const queryInterface = sequelize.getQueryInterface();

    // Create migrations table if it doesn't exist
    try {
      await queryInterface.describeTable('migrations');
    } catch (error) {
      await queryInterface.createTable('migrations', {
        id: {
          type: Sequelize.DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        executed_at: {
          type: Sequelize.DataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Get already executed migrations
    const [executedMigrations] = await sequelize.query('SELECT name FROM migrations');
    const executedMigrationNames = executedMigrations.map(m => m.name);

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        const migration = require(path.join(migrationsDir, file));
        
        // Run the migration (supports both custom and sequelize-cli style signatures)
        const result = await migration.up(queryInterface, Sequelize);
        
        if (result !== false) {
          // Record the migration
          await sequelize.query(
            'INSERT INTO migrations (name) VALUES (:name)',
            {
              replacements: { name: file }
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
