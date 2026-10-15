const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reply author is required']
    },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const discussionSchema = new mongoose.Schema(
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
      required: [true, 'Discussion title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Discussion content is required'],
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'closed'],
        message: '{VALUE} is not a valid discussion status'
      },
      default: 'active'
    },
    replies: {
      type: [replySchema],
      default: []
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

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion;
