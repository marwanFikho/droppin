const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Add pickupId column to Packages table
    await queryInterface.addColumn('Packages', 'pickupId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Pickups',
        key: 'id'
      }
    });

    // Add notes column to Packages table
    await queryInterface.addColumn('Packages', 'notes', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    // Add shopNotes column to Packages table
    await queryInterface.addColumn('Packages', 'shopNotes', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    // Add signature column to Packages table
    await queryInterface.addColumn('Packages', 'signature', {
      type: DataTypes.JSON,
      defaultValue: null
    });

    // Add deliveryPhotos column to Packages table
    await queryInterface.addColumn('Packages', 'deliveryPhotos', {
      type: DataTypes.JSON,
      defaultValue: null
    });

    // Add statusHistory column to Packages table
    await queryInterface.addColumn('Packages', 'statusHistory', {
      type: DataTypes.JSON,
      defaultValue: null
    });

    // Add rejectionShippingPaidAmount column to Packages table
    await queryInterface.addColumn('Packages', 'rejectionShippingPaidAmount', {
      type: sequelize.Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
      comment: 'Amount of shop shipping fees paid by customer at rejection'
    });

    // Update the status enum to include new statuses
    await queryInterface.changeColumn('Packages', 'status', {
      type: DataTypes.ENUM('awaiting_schedule', 'awaiting_pickup', 'scheduled_for_pickup', 'pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned'),
      defaultValue: 'awaiting_schedule'
    });

    console.log('Added missing columns to Packages table successfully');
    return true;
  } catch (error) {
    console.error('Error adding missing columns to Packages table:', error);
    return false;
  }
}

async function down() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Remove the added columns
    await queryInterface.removeColumn('Packages', 'pickupId');
    await queryInterface.removeColumn('Packages', 'notes');
    await queryInterface.removeColumn('Packages', 'shopNotes');
    await queryInterface.removeColumn('Packages', 'signature');
    await queryInterface.removeColumn('Packages', 'deliveryPhotos');
    await queryInterface.removeColumn('Packages', 'statusHistory');
    await queryInterface.removeColumn('Packages', 'rejectionShippingPaidAmount');

    // Revert status enum to original values
    await queryInterface.changeColumn('Packages', 'status', {
      type: DataTypes.ENUM('pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    });

    console.log('Removed added columns from Packages table successfully');
    return true;
  } catch (error) {
    console.error('Error removing columns from Packages table:', error);
    return false;
  }
}

module.exports = { up, down }; 