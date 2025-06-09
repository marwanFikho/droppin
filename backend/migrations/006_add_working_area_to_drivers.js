const { sequelize } = require('../config/db.config');

async function up() {
  try {
    // Add workingArea column to Drivers table
    await sequelize.getQueryInterface().addColumn('Drivers', 'workingArea', {
      type: sequelize.Sequelize.STRING,
      allowNull: true,
      comment: 'The area where the driver works (set by admin)'
    });

    console.log('workingArea field added to Drivers table successfully');
    return true;
  } catch (error) {
    console.error('Error adding workingArea field:', error);
    return false;
  }
}

async function down() {
  try {
    // Remove workingArea column from Drivers table
    await sequelize.getQueryInterface().removeColumn('Drivers', 'workingArea');

    console.log('workingArea field removed from Drivers table successfully');
    return true;
  } catch (error) {
    console.error('Error removing workingArea field:', error);
    return false;
  }
}

module.exports = { up, down }; 