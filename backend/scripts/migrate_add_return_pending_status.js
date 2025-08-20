'use strict';

const { sequelize, testConnection } = require('../config/db.config');

(async () => {
	try {
		const ok = await testConnection();
		if (!ok) {
			throw new Error('DB connection failed. Aborting migration.');
		}

		const dialect = sequelize.getDialect();
		console.log(`[migration] Starting 'add return-pending status' for dialect: ${dialect}`);

		if (dialect === 'sqlite') {
			// SQLite does not enforce ENUMs; the column is stored as TEXT.
			// Nothing to change at the DB level. We just verify the column exists.
			const [columns] = await sequelize.query("PRAGMA table_info('Packages')");
			const hasStatus = Array.isArray(columns) && columns.some(c => c.name === 'status');
			if (!hasStatus) {
				throw new Error("'status' column not found on Packages table");
			}
			console.log("[migration] SQLite detected. No DB enum to alter; application code now accepts 'return-pending'. Done.");
		} else if (dialect === 'postgres') {
			// Add value to existing enum type used by Sequelize for this column
			// Default naming by Sequelize is "enum_<TableName>_<columnName>"
			const enumType = 'enum_Packages_status';
			await sequelize.query(`ALTER TYPE "${enumType}" ADD VALUE IF NOT EXISTS 'return-pending';`);
			console.log(`[migration] Added 'return-pending' to ${enumType}`);
		} else if (dialect === 'mysql' || dialect === 'mariadb') {
			// Re-specify the enum values including the new one
			await sequelize.query(
				"ALTER TABLE `Packages` MODIFY `status` ENUM('awaiting_schedule','awaiting_pickup','scheduled_for_pickup','pending','assigned','pickedup','in-transit','delivered','cancelled','cancelled-awaiting-return','cancelled-returned','rejected','rejected-awaiting-return','rejected-returned','return-requested','return-in-transit','return-pending','return-completed') NOT NULL DEFAULT 'awaiting_schedule';"
			);
			console.log("[migration] Updated Packages.status enum to include 'return-pending' (MySQL/MariaDB)");
		} else {
			console.log(`[migration] Dialect '${dialect}' not explicitly handled. No changes applied.`);
		}

		console.log('[migration] Completed successfully.');
		process.exit(0);
	} catch (err) {
		console.error('[migration] Failed:', err.message);
		process.exit(1);
	} finally {
		try {
			await sequelize.close();
		} catch (_) {}
	}
})(); 