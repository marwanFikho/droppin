const { sequelize } = require('../config/db.config');

module.exports = {
  up: async () => {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('Packages', 'deliveryCost', {
      type: sequelize.Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'The cost of delivering this package'
    });

    await queryInterface.addColumn('Packages', 'paymentMethod', {
      type: sequelize.Sequelize.ENUM('cash', 'card', 'bank_transfer', 'other'),
      allowNull: true,
      comment: 'Method of payment collection'
    });

    await queryInterface.addColumn('Packages', 'paymentNotes', {
      type: sequelize.Sequelize.STRING,
      allowNull: true,
      comment: 'Additional notes about the payment'
    });
  },

  down: async () => {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.removeColumn('Packages', 'paymentNotes');
    await queryInterface.removeColumn('Packages', 'paymentMethod');
    await queryInterface.removeColumn('Packages', 'deliveryCost');
  }
};
