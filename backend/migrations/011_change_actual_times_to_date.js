const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('Packages', 'actualPickupTime', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.changeColumn('Packages', 'actualDeliveryTime', {
      type: DataTypes.DATE,
      allowNull: true
    });
    console.log('Changed actualPickupTime and actualDeliveryTime to DATE type');
    return true;
  } catch (error) {
    console.error('Error changing columns to DATE:', error);
    return false;
  }
}

async function down() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.changeColumn('Packages', 'actualPickupTime', {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.changeColumn('Packages', 'actualDeliveryTime', {
      type: DataTypes.STRING,
      allowNull: true
    });
    console.log('Reverted actualPickupTime and actualDeliveryTime to STRING type');
    return true;
  } catch (error) {
    console.error('Error reverting columns to STRING:', error);
    return false;
  }
}

module.exports = { up, down }; 