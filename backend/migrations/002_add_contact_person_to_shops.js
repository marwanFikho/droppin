const { sequelize } = require('../config/db.config');
const { DataTypes } = require('sequelize');

async function up() {
  try {
    // Add contactPersonName column
    await sequelize.query(
      `ALTER TABLE Shops ADD COLUMN contactPersonName TEXT;`
    );
    
    // Add contactPersonPhone column
    await sequelize.query(
      `ALTER TABLE Shops ADD COLUMN contactPersonPhone TEXT;`
    );
    
    // Add contactPersonEmail column
    await sequelize.query(
      `ALTER TABLE Shops ADD COLUMN contactPersonEmail TEXT;`
    );
    
    console.log('Contact person fields added to Shops table successfully');
    return true;
  } catch (error) {
    console.error('Error adding contact person fields to Shops table:', error);
    return false;
  }
}

async function down() {
  try {
    // Remove contactPersonEmail column
    await sequelize.query(
      `ALTER TABLE Shops DROP COLUMN contactPersonEmail;`
    );
    
    // Remove contactPersonPhone column
    await sequelize.query(
      `ALTER TABLE Shops DROP COLUMN contactPersonPhone;`
    );
    
    // Remove contactPersonName column
    await sequelize.query(
      `ALTER TABLE Shops DROP COLUMN contactPersonName;`
    );
    
    console.log('Contact person fields removed from Shops table successfully');
    return true;
  } catch (error) {
    console.error('Error removing contact person fields from Shops table:', error);
    return false;
  }
}

module.exports = {
  up,
  down
};
