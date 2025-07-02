const { sequelize } = require('../config/db.config');

async function up() {
  try {
    // Update date fields to STRING type
    await sequelize.getQueryInterface().changeColumn('Packages', 'schedulePickupTime', {
      type: sequelize.Sequelize.STRING,
      allowNull: false
    });

    await sequelize.getQueryInterface().changeColumn('Packages', 'estimatedDeliveryTime', {
      type: sequelize.Sequelize.STRING,
      allowNull: true
    });

    await sequelize.getQueryInterface().changeColumn('Packages', 'actualPickupTime', {
      type: sequelize.Sequelize.STRING,
      allowNull: true
    });

    await sequelize.getQueryInterface().changeColumn('Packages', 'actualDeliveryTime', {
      type: sequelize.Sequelize.STRING,
      allowNull: true
    });

    await sequelize.getQueryInterface().changeColumn('Packages', 'paymentDate', {
      type: sequelize.Sequelize.STRING,
      allowNull: true
    });

    console.log('Date fields updated to STRING type successfully');
    return true;
  } catch (error) {
    console.error('Error updating date fields:', error);
    return false;
  }
}

async function down() {
  try {
    // Revert back to DATE type
    await sequelize.getQueryInterface().changeColumn('Packages', 'schedulePickupTime', {
      type: sequelize.Sequelize.DATE,
      allowNull: false
    });

    await sequelize.getQueryInterface().changeColumn('Packages', 'estimatedDeliveryTime', {
      type: sequelize.Sequelize.DATE,
      allowNull: true
    });

    await sequelize.getQueryInterface().changeColumn('Packages', 'actualPickupTime', {
      type: sequelize.Sequelize.DATE,
      allowNull: true
    });

    await sequelize.getQueryInterface().changeColumn('Packages', 'actualDeliveryTime', {
      type: sequelize.Sequelize.DATE,
      allowNull: true
    });

    await sequelize.getQueryInterface().changeColumn('Packages', 'paymentDate', {
      type: sequelize.Sequelize.DATE,
      allowNull: true
    });

    console.log('Date fields reverted to DATE type successfully');
    return true;
  } catch (error) {
    console.error('Error reverting date fields:', error);
    return false;
  }
}

module.exports = { up, down }; 