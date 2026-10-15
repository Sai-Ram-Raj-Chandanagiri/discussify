const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Activity action is required'],
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { _id: false }
);

const notificationSettingsSchema = new mongoose.Schema(
  {
    newDiscussions: {
      type: Boolean,
      default: true
    },
    newResources: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      immutable: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a valid role'
      },
      default: 'user'
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    profilePictureUrl: {
      type: String,
      default: '',
      trim: true
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    activityLog: {
      type: [activitySchema],
      default: []
    },
    notificationSettings: {
      type: notificationSettingsSchema,
      default: () => ({ newDiscussions: true, newResources: true }),
      validate: {
        validator: function (settings) {
          if (!settings) return false;
          // Custom validator: User should not be able to turn off all notifications
          // Prevents both newDiscussions and newResources from being false simultaneously
          return !(settings.newDiscussions === false && settings.newResources === false);
        },
        message: 'You cannot turn off all notifications. At least one notification type must remain enabled.'
      }
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
