'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'Revenue' to the ENUM values for the attribute column
    await queryInterface.sequelize.query(`
      ALTER TABLE "MoneyTransactions" 
      ALTER COLUMN "attribute" TYPE VARCHAR(255);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "MoneyTransactions" 
      ALTER COLUMN "attribute" TYPE ENUM('ToCollect', 'TotalCollected', 'Revenue') 
      USING "attribute"::text::ENUM('ToCollect', 'TotalCollected', 'Revenue');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove 'Revenue' from the ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE "MoneyTransactions" 
      ALTER COLUMN "attribute" TYPE VARCHAR(255);
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "MoneyTransactions" 
      ALTER COLUMN "attribute" TYPE ENUM('ToCollect', 'TotalCollected') 
      USING "attribute"::text::ENUM('ToCollect', 'TotalCollected');
    `);
  }
}; 