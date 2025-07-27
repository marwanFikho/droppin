'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // For SQLite, we don't need to modify ENUM types since SQLite doesn't enforce them
      // The new statuses will be handled by the application logic
      console.log('New rejected statuses will be handled by application logic (SQLite doesn\'t enforce ENUM constraints)');
    } catch (error) {
      console.error('Error in migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // No rollback needed for SQLite since we didn't modify the schema
      console.log('No rollback needed for SQLite ENUM migration');
    } catch (error) {
      console.error('Error in migration rollback:', error);
      throw error;
    }
  }
};
