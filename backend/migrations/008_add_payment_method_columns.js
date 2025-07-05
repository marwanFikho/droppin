const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Add paymentMethod column to Packages table
    await queryInterface.addColumn('Packages', 'paymentMethod', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Method of payment collection'
    });

    // Add paymentNotes column to Packages table
    await queryInterface.addColumn('Packages', 'paymentNotes', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the payment'
    });

    console.log('Added payment method columns to Packages table successfully');
    return true;
  } catch (error) {
    console.error('Error adding payment method columns to Packages table:', error);
    return false;
  }
}

async function down() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Remove the added columns
    await queryInterface.removeColumn('Packages', 'paymentNotes');
    await queryInterface.removeColumn('Packages', 'paymentMethod');

    console.log('Removed payment method columns from Packages table successfully');
    return true;
  } catch (error) {
    console.error('Error removing payment method columns from Packages table:', error);
    return false;
  }
}

module.exports = { up, down }; 