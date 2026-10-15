const mongoose = require('mongoose');

// Maximum allowed resource file size (10 MB in bytes)
const MAX_RESOURCE_FILE_SIZE = 10 * 1024 * 1024;

const resourceSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: [true, 'Community reference is required']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required']
    },
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: {
        values: ['article', 'video', 'other'],
        message: '{VALUE} is not a valid resource type'
      }
    },
    urlOrFilePath: {
      type: String,
      required: [true, 'Resource URL or file path is required'],
      trim: true
    },
    fileSize: {
      type: Number,
      validate: {
        validator: function (val) {
          if (val === undefined || val === null) return true;
          return typeof val === 'number' && val >= 0 && val <= MAX_RESOURCE_FILE_SIZE;
        },
        message: `File size exceeds the maximum limit of ${MAX_RESOURCE_FILE_SIZE / (1024 * 1024)} MB`
      }
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

resourceSchema.statics.MAX_FILE_SIZE = MAX_RESOURCE_FILE_SIZE;

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
