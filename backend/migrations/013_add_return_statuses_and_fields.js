'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		const transaction = await queryInterface.sequelize.transaction();
		try {
			// Alter status enum to include return statuses
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
					'return-completed'
				),
				defaultValue: 'awaiting_schedule'
			}, { transaction });

			// Add returnDetails JSON column
			await queryInterface.addColumn('Packages', 'returnDetails', {
				type: Sequelize.JSON,
				allowNull: true,
				defaultValue: null
			}, { transaction });
			// Add returnRefundAmount FLOAT column
			await queryInterface.addColumn('Packages', 'returnRefundAmount', {
				type: Sequelize.FLOAT,
				allowNull: true,
				defaultValue: 0
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
			// Remove added columns
			await queryInterface.removeColumn('Packages', 'returnDetails', { transaction });
			await queryInterface.removeColumn('Packages', 'returnRefundAmount', { transaction });

			// Revert enum (without return statuses)
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
					'rejected-returned'
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