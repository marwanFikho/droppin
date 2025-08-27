'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const transaction = await queryInterface.sequelize.transaction();
		try {
			// Extend status enum with delivered-awaiting-return and delivered-returned
			await queryInterface.changeColumn('Packages', 'status', {
				type: Sequelize.ENUM(
					'awaiting_schedule',
					'awaiting_pickup',
					'scheduled_for_pickup',
					'pending',
					'assigned',
					'pickedup',
					'in-transit',
					'delivered',
					'delivered-awaiting-return',
					'delivered-returned',
					'cancelled',
					'cancelled-awaiting-return',
					'cancelled-returned',
					'rejected',
					'rejected-awaiting-return',
					'rejected-returned',
					'return-requested',
					'return-in-transit',
					'return-pending',
					'return-completed',
					'exchange-awaiting-schedule',
					'exchange-awaiting-pickup',
					'exchange-in-process',
					'exchange-in-transit',
					'exchange-awaiting-return',
					'exchange-returned',
					'exchange-cancelled'
				),
				defaultValue: 'awaiting_schedule'
			}, { transaction });

			// Add paidAmount column
			await queryInterface.addColumn('Packages', 'paidAmount', {
				type: Sequelize.FLOAT,
				allowNull: true,
				defaultValue: 0
			}, { transaction });

			// Add deliveredItems JSON column
			await queryInterface.addColumn('Packages', 'deliveredItems', {
				type: Sequelize.JSON,
				allowNull: true,
				defaultValue: null
			}, { transaction });

			await transaction.commit();
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	},
	down: async (queryInterface, Sequelize) => {
		const transaction = await queryInterface.sequelize.transaction();
		try {
			// Remove new columns
			await queryInterface.removeColumn('Packages', 'paidAmount', { transaction });
			await queryInterface.removeColumn('Packages', 'deliveredItems', { transaction });

			// Revert enum without delivered-awaiting-return and delivered-returned
			await queryInterface.changeColumn('Packages', 'status', {
				type: Sequelize.ENUM(
					'awaiting_schedule',
					'awaiting_pickup',
					'scheduled_for_pickup',
					'pending',
					'assigned',
					'pickedup',
					'in-transit',
					'delivered',
					'cancelled',
					'cancelled-awaiting-return',
					'cancelled-returned',
					'rejected',
					'rejected-awaiting-return',
					'rejected-returned',
					'return-requested',
					'return-in-transit',
					'return-pending',
					'return-completed',
					'exchange-awaiting-schedule',
					'exchange-awaiting-pickup',
					'exchange-in-process',
					'exchange-in-transit',
					'exchange-awaiting-return',
					'exchange-returned',
					'exchange-cancelled'
				),
				defaultValue: 'awaiting_schedule'
			}, { transaction });

			await transaction.commit();
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	}
};


