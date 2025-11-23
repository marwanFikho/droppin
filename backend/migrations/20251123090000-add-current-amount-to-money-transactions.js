'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('MoneyTransactions', 'currentAmount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      });
    } catch (e) {
      // ignore if already exists
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('MoneyTransactions', 'currentAmount');
    } catch (e) {
      // ignore
    }
  }
};
