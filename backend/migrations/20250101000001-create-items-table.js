'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      packageId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Packages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      codAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add index on packageId for better query performance
    await queryInterface.addIndex('Items', ['packageId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Items');
  }
}; 