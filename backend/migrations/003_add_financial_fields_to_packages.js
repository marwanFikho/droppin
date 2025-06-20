module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Packages', 'deliveryCost', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'The cost of delivering this package'
    });

    await queryInterface.addColumn('Packages', 'codAmount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Cash on delivery amount to be collected from recipient'
    });

    await queryInterface.addColumn('Packages', 'isPaid', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the COD amount has been collected'
    });

    await queryInterface.addColumn('Packages', 'paymentDate', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the payment was collected'
    });

    await queryInterface.addColumn('Packages', 'paymentMethod', {
      type: Sequelize.ENUM('cash', 'card', 'bank_transfer', 'other'),
      allowNull: true,
      comment: 'Method of payment collection'
    });

    await queryInterface.addColumn('Packages', 'paymentNotes', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Additional notes about the payment'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Packages', 'paymentNotes');
    await queryInterface.removeColumn('Packages', 'paymentMethod');
    await queryInterface.removeColumn('Packages', 'paymentDate');
    await queryInterface.removeColumn('Packages', 'isPaid');
    await queryInterface.removeColumn('Packages', 'codAmount');
    await queryInterface.removeColumn('Packages', 'deliveryCost');
  }
};
