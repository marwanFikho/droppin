const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    // Update status enum
    await queryInterface.changeColumn('Packages', 'status', {
      type: DataTypes.ENUM(
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
    });

    // Add exchangeDetails column if not exists
    const tableDesc = await queryInterface.describeTable('Packages');
    if (!tableDesc.exchangeDetails) {
      await queryInterface.addColumn('Packages', 'exchangeDetails', {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
      });
    }

    console.log('Added exchange statuses and exchangeDetails field');
    return true;
  } catch (err) {
    console.error('Migration failed (add exchange statuses/field):', err);
    return false;
  }
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    // Remove exchangeDetails column if exists
    const tableDesc = await queryInterface.describeTable('Packages');
    if (tableDesc.exchangeDetails) {
      await queryInterface.removeColumn('Packages', 'exchangeDetails');
    }

    // Revert status enum to previous set (without exchange)
    await queryInterface.changeColumn('Packages', 'status', {
      type: DataTypes.ENUM(
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
        'return-completed'
      ),
      defaultValue: 'awaiting_schedule'
    });

    console.log('Reverted exchange statuses and removed exchangeDetails field');
    return true;
  } catch (err) {
    console.error('Migration down failed (exchange statuses/field):', err);
    return false;
  }
}

module.exports = { up, down }; 