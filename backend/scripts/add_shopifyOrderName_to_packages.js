// Standalone migration script to add shopifyOrderName to Packages
const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function run() {
	try {
		await sequelize.getQueryInterface().addColumn('Packages', 'shopifyOrderName', {
			type: DataTypes.STRING,
			allowNull: true,
		});
		console.log('Migration successful: shopifyOrderName column added to Packages table.');
		process.exit(0);
	} catch (error) {
		const msg = String(error && error.message || error);
		if (msg.includes('duplicate column name') || msg.toLowerCase().includes('already exists')) {
			console.log('Column shopifyOrderName already exists.');
			process.exit(0);
		}
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

run(); 