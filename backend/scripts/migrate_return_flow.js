'use strict';

const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function columnExists(queryInterface, tableName, columnName) {
	const [rows] = await queryInterface.sequelize.query(`PRAGMA table_info(${tableName});`);
	return Array.isArray(rows) && rows.some(col => col.name === columnName);
}

(async function run() {
	console.log('Starting standalone migration for return flow...');
	const queryInterface = sequelize.getQueryInterface();
	const transaction = await sequelize.transaction();
	try {
		// 1) Add returnDetails JSON column if missing
		const hasReturnDetails = await columnExists(queryInterface, 'Packages', 'returnDetails');
		if (!hasReturnDetails) {
			console.log('Adding column Packages.returnDetails (JSON) ...');
			await queryInterface.addColumn('Packages', 'returnDetails', {
				type: DataTypes.JSON,
				allowNull: true,
				defaultValue: null
			}, { transaction });
			console.log('Added Packages.returnDetails');
		} else {
			console.log('Column Packages.returnDetails already exists, skipping');
		}

		// 2) Add returnRefundAmount FLOAT column if missing
		const hasReturnRefundAmount = await columnExists(queryInterface, 'Packages', 'returnRefundAmount');
		if (!hasReturnRefundAmount) {
			console.log('Adding column Packages.returnRefundAmount (FLOAT) ...');
			await queryInterface.addColumn('Packages', 'returnRefundAmount', {
				type: DataTypes.FLOAT,
				allowNull: true,
				defaultValue: 0
			}, { transaction });
			console.log('Added Packages.returnRefundAmount');
		} else {
			console.log('Column Packages.returnRefundAmount already exists, skipping');
		}

		await transaction.commit();
		console.log('Standalone migration completed successfully.');
		process.exit(0);
	} catch (err) {
		console.error('Standalone migration failed:', err);
		try { await transaction.rollback(); } catch {}
		process.exit(1);
	}
})();
