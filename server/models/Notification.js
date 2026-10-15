const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient reference is required']
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'Community reference is required']
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['discussion', 'resource'],
        message: '{VALUE} is not a valid notification type'
      }
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
