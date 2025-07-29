module.exports = (sequelize, DataTypes) => {
  const Package = sequelize.define('Package', {
    shopId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Shops',
        key: 'id'
      }
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Drivers',
        key: 'id'
      }
    },
    trackingNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    packageDescription: {
      type: DataTypes.STRING,
      allowNull: false
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    dimensions: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned'),
      defaultValue: 'pending'
    },
    statusHistory: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    pickupAddress: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    deliveryAddress: {
      type: DataTypes.JSON,
      allowNull: false
    },
    schedulePickupTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualPickupTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveryFee: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    shownDeliveryCost: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    priority: {
      type: DataTypes.ENUM('normal', 'express', 'same-day'),
      defaultValue: 'normal'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    signature: {
      type: DataTypes.JSON,
      defaultValue: null
    },
    deliveryPhotos: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    hooks: {
      beforeCreate: (package) => {
        if (!package.trackingNumber) {
          const prefix = 'DP'; // Droppin prefix
          const timestamp = Math.floor(Date.now() / 1000).toString(16); // Unix timestamp in hex
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          
          package.trackingNumber = `${prefix}${timestamp}${random}`.toUpperCase();
        }
      }
    }
  });

  return Package;
};
