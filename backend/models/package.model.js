const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    trackingNumber: {
      type: String,
      unique: true,
      required: true,
    },
    packageDescription: {
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'assigned', 'pickedup', 'in-transit', 'delivered', 'cancelled', 'returned'],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    pickupAddress: {
      contactName: String,
      contactPhone: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      location: {
        lat: Number,
        lng: Number,
      },
      instructions: String,
    },
    deliveryAddress: {
      contactName: {
        type: String,
        required: true,
      },
      contactPhone: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      location: {
        lat: Number,
        lng: Number,
      },
      instructions: String,
    },
    schedulePickupTime: {
      type: Date,
      required: true,
    },
    estimatedDeliveryTime: Date,
    actualPickupTime: Date,
    actualDeliveryTime: Date,
    deliveryFee: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      enum: ['normal', 'express', 'same-day'],
      default: 'normal',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    notes: String,
    signature: {
      data: String,
      timestamp: Date,
    },
    deliveryPhotos: [
      {
        url: String,
        timestamp: Date,
      },
    ],
  },
  { timestamps: true }
);

// Generate unique tracking number
packageSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  
  const prefix = 'DP'; // Dropin prefix
  const timestamp = Math.floor(Date.now() / 1000).toString(16); // Unix timestamp in hex
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  this.trackingNumber = `${prefix}${timestamp}${random}`.toUpperCase();
  next();
});

const Package = mongoose.model('Package', packageSchema);

module.exports = Package;
