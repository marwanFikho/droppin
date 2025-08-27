const { sequelize } = require('../config/db.config');

async function up() {
  try {
    const qi = sequelize.getQueryInterface();
    // Add cashOnHand column if not exists
    await qi.addColumn('Drivers', 'cashOnHand', {
      type: sequelize.Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Accumulated COD cash currently held by the driver'
    });
    console.log('Added cashOnHand to Drivers table successfully');
    return true;
  } catch (error) {
    console.error('Error adding cashOnHand to Drivers table:', error);
    return false;
  }
}

async function down() {
  try {
    const qi = sequelize.getQueryInterface();
    await qi.removeColumn('Drivers', 'cashOnHand');
    console.log('Removed cashOnHand from Drivers table successfully');
    return true;
  } catch (error) {
    console.error('Error removing cashOnHand from Drivers table:', error);
    return false;
  }
}

module.exports = { up, down };


