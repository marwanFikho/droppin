module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define('Driver', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    vehicleType: {
      type: DataTypes.ENUM('car', 'motorcycle', 'bicycle', 'van', 'truck'),
      allowNull: false
    },
    vehicleDetails: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    idNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    currentLocation: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalDeliveries: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    documents: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  });

  return Driver;
};
