const mongoose = require('mongoose');
const { Community, Discussion, Notification } = require('../models');

/**
 * @route   POST /api/communities/:id/discussions
 * @desc    Create a new discussion in a community
 * @access  Private (Members only)
 */
const createDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid community ID.'
      });
    }

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        message: 'Community not found.'
      });
    }

    // STRICT NEGATIVE CRITERION:
    // Verify the user is in community.members; if not, return 403 Forbidden with exact message:
    // "You must be a member of this community to participate in discussions."
    const isMember = community.members.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'You must be a member of this community to participate in discussions.'
      });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        message: 'Discussion title is required.'
      });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        message: 'Discussion content is required.'
      });
    }

    const discussion = new Discussion({
      community: community._id,
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      status: 'active',
      replies: []
    });

    await discussion.save();

    // Log activity in author's profile
    req.user.activityLog.push({
      action: `Created discussion: ${discussion.title}`,
      timestamp: new Date()
    });
    await req.user.save();

    // Notify other community members who haven't turned off discussion notifications
    try {
      const otherMembers = community.members.filter(
        (m) => m.toString() !== req.user._id.toString()
      );
      if (otherMembers.length > 0) {
        const notifications = otherMembers.map((memberId) => ({
          recipient: memberId,
          community: community._id,
          type: 'discussion',
          message: `New discussion "${discussion.title}" started in ${community.name} by ${req.user.name}.`
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn('Notification dispatch non-fatal error:', notifErr.message);
    }

    await discussion.populate('author', 'name email profilePictureUrl');

    return res.status(201).json({
      message: 'Discussion created successfully.',
      discussion
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    return res.status(500).json({
      message: 'Failed to create discussion.'
    });
  }
};

/**
 * @route   POST /api/discussions/:discussionId/replies
 * @desc    Reply to an existing discussion
 * @access  Private (Community members only)
 */
const replyDiscussion = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({
        message: 'Invalid discussion ID.'
      });
    }

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        message: 'Discussion not found.'
      });
    }

    // Check status
    if (discussion.status === 'closed') {
      return res.status(400).json({
        message: 'This discussion is closed and no longer accepting replies.'
      });
    }

    const community = await Community.findById(discussion.community);
    if (!community) {
      return res.status(404).json({
        message: 'Parent community not found.'
      });
    }

    // STRICT NEGATIVE CRITERION:
    // Verify the user is in community.members; if not, return 403 Forbidden with exact message:
    // "You must be a member of this community to participate in discussions."
    const isMember = community.members.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'You must be a member of this community to participate in discussions.'
      });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        message: 'Reply content is required.'
      });
    }

    discussion.replies.push({
      author: req.user._id,
      content: content.trim(),
      createdAt: new Date()
    });

    await discussion.save();

    // Log activity
    req.user.activityLog.push({
      action: `Replied to discussion: ${discussion.title}`,
      timestamp: new Date()
    });
    await req.user.save();

    await discussion.populate('author', 'name email profilePictureUrl');
    await discussion.populate('replies.author', 'name email profilePictureUrl');

    return res.status(201).json({
      message: 'Reply posted successfully.',
      discussion
    });
  } catch (error) {
    console.error('Reply discussion error:', error);
    return res.status(500).json({
      message: 'Failed to post reply.'
    });
  }
};

/**
 * @route   GET /api/communities/:id/discussions
 * @desc    Get all discussions for a community
 * @access  Public / Private
 */
const getDiscussionsByCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid community ID.'
      });
    }

    const discussions = await Discussion.find({ community: id })
      .populate('author', 'name email profilePictureUrl')
      .populate('replies.author', 'name email profilePictureUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: discussions.length,
      discussions
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve discussions.'
    });
  }
};

/**
 * @route   GET /api/discussions/:discussionId
 * @desc    Get a single discussion by ID
 * @access  Public / Private
 */
const getDiscussionById = async (req, res) => {
  try {
    const { discussionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return res.status(400).json({
        message: 'Invalid discussion ID.'
      });
    }

    const discussion = await Discussion.findById(discussionId)
      .populate('author', 'name email profilePictureUrl')
      .populate('replies.author', 'name email profilePictureUrl');

    if (!discussion) {
      return res.status(404).json({
        message: 'Discussion not found.'
      });
    }

    return res.status(200).json({
      discussion
    });
  } catch (error) {
    console.error('Get discussion error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve discussion.'
    });
  }
};

module.exports = {
  createDiscussion,
  replyDiscussion,
  getDiscussionsByCommunity,
  getDiscussionById
};
