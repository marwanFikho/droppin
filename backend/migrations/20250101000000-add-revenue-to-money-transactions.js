'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'Revenue' and 'DriverCashOnHand' to the ENUM values for the attribute column
    await queryInterface.sequelize.query(`
      ALTER TABLE "MoneyTransactions" 
      ALTER COLUMN "attribute" TYPE VARCHAR(255);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "MoneyTransactions" 
      ALTER COLUMN "attribute" TYPE ENUM('ToCollect', 'TotalCollected', 'Revenue', 'DriverCashOnHand') 
      USING "attribute"::text::ENUM('ToCollect', 'TotalCollected', 'Revenue', 'DriverCashOnHand');
    `);

    // Add driverId (nullable)
    try {
      await queryInterface.addColumn('MoneyTransactions', 'driverId', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } catch (e) {}
  },

  down: async (queryInterface, Sequelize) => {
    // Remove 'DriverCashOnHand' from the ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE "MoneyTransactions" 
      ALTER COLUMN "attribute" TYPE VARCHAR(255);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "MoneyTransactions" 
      ALTER COLUMN "attribute" TYPE ENUM('ToCollect', 'TotalCollected', 'Revenue') 
      USING "attribute"::text::ENUM('ToCollect', 'TotalCollected', 'Revenue');
    `);

    try { await queryInterface.removeColumn('MoneyTransactions', 'driverId'); } catch (e) {}
  }
}; 