const mongoose = require('mongoose');
const { Community, Resource, Notification, User } = require('../models');

/**
 * @route   GET /api/communities/:id/resources
 * @desc    List all shared resources in a community
 * @access  Public / Private
 */
const getResourcesByCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid community ID.'
      });
    }

    const resources = await Resource.find({ community: id })
      .populate('author', 'name email profilePictureUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: resources.length,
      resources
    });
  } catch (error) {
    console.error('Get resources error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve resources.'
    });
  }
};

/**
 * @route   POST /api/communities/:id/resources
 * @desc    Share an article, video, or file in a community
 * @access  Private (Community members only)
 */
const createResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type } = req.body;

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

    // Verify membership
    const isMember = community.members.some(
      (m) => m.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        message: 'You must be a member of this community to share resources.'
      });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        message: 'Resource title is required.'
      });
    }

    // Determine urlOrFilePath and fileSize
    let urlOrFilePath = '';
    let fileSize = 0;

    if (req.file) {
      const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
      urlOrFilePath = `${serverUrl}/uploads/${req.file.filename}`;
      fileSize = req.file.size;
    } else if (req.body.urlOrFilePath && typeof req.body.urlOrFilePath === 'string') {
      urlOrFilePath = req.body.urlOrFilePath.trim();
      fileSize = Number(req.body.fileSize) || 0;
    } else {
      return res.status(400).json({
        message: 'Please provide a resource URL or upload a file.'
      });
    }

    // STRICT NEGATIVE CRITERION:
    // Enforce maximum file size limit of 5MB
    // Return 400 Bad Request with "The resource exceeds the maximum allowed size limit."
    const MAX_RESOURCE_SIZE = 5 * 1024 * 1024;
    if (fileSize > MAX_RESOURCE_SIZE) {
      return res.status(400).json({
        message: 'The resource exceeds the maximum allowed size limit.'
      });
    }

    // Determine type: 'article' | 'video' | 'other'
    let resourceType = 'other';
    if (type && ['article', 'video', 'other'].includes(type.toLowerCase())) {
      resourceType = type.toLowerCase();
    } else if (urlOrFilePath.match(/\.(mp4|webm|ogg|mov|avi)$/i) || urlOrFilePath.includes('youtube') || urlOrFilePath.includes('vimeo')) {
      resourceType = 'video';
    } else if (urlOrFilePath.startsWith('http')) {
      resourceType = 'article';
    }

    const resource = new Resource({
      community: community._id,
      author: req.user._id,
      title: title.trim(),
      type: resourceType,
      urlOrFilePath,
      fileSize
    });

    await resource.save();

    // Log activity
    req.user.activityLog.push({
      action: `Shared resource: ${resource.title}`,
      timestamp: new Date()
    });
    await req.user.save();

    // Dispatch notification to other active community members who haven't disabled resource notifications
    try {
      const otherMembers = community.members.filter(
        (m) => m.toString() !== req.user._id.toString()
      );
      if (otherMembers.length > 0) {
        const eligibleUsers = await User.find({
          _id: { $in: otherMembers },
          'notificationSettings.newResources': { $ne: false }
        }).select('_id');

        if (eligibleUsers.length > 0) {
          const notifications = eligibleUsers.map((member) => ({
            recipient: member._id,
            community: community._id,
            type: 'resource',
            message: `${req.user.name} shared a new resource "${resource.title}" in ${community.name}.`
          }));
          await Notification.insertMany(notifications);
        }
      }
    } catch (notifErr) {
      console.warn('Notification dispatch error:', notifErr.message);
    }

    await resource.populate('author', 'name email profilePictureUrl');

    return res.status(201).json({
      message: 'Resource shared successfully.',
      resource
    });
  } catch (error) {
    console.error('Create resource error:', error);
    return res.status(500).json({
      message: 'Failed to share resource. Please try again.'
    });
  }
};

module.exports = {
  getResourcesByCommunity,
  createResource
};
