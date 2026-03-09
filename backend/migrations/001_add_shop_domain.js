const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function columnExists(queryInterface, tableName, columnName) {
  try {
    const tableDescription = await queryInterface.describeTable(tableName);
    return !!tableDescription[columnName];
  } catch (error) {
    return false;
  }
}

async function up() {
  const queryInterface = sequelize.getQueryInterface();

  // Add shopDomain column to Shops table
  if (!(await columnExists(queryInterface, 'Shops', 'shopDomain'))) {
    await queryInterface.addColumn('Shops', 'shopDomain', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Shopify shop domain (e.g., droppin-testing.myshopify.com)'
    });
    console.log('✓ Added shopDomain column to Shops table');
  }
}

async function down() {
  const queryInterface = sequelize.getQueryInterface();

  // Remove shopDomain column from Shops table
  if (await columnExists(queryInterface, 'Shops', 'shopDomain')) {
    await queryInterface.removeColumn('Shops', 'shopDomain');
    console.log('✓ Removed shopDomain column from Shops table');
  }
}

module.exports = { up, down };
