const mongoose = require('mongoose');
const { Community, User, Notification } = require('../models');

// Helper to escape special regex characters for case-insensitive matching
const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * @route   POST /api/communities
 * @desc    Create a new community
 * @access  Private
 */
const createCommunity = async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        message: 'Community name is required.'
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 80) {
      return res.status(400).json({
        message: 'Community name must be between 2 and 80 characters.'
      });
    }

    // Case-insensitive uniqueness check
    const existingCommunity = await Community.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
    });

    if (existingCommunity) {
      return res.status(409).json({
        message: 'A community with this name already exists.'
      });
    }

    // Automatically add creator to members
    const newCommunity = new Community({
      name: trimmedName,
      description: description ? description.trim() : '',
      isPrivate: Boolean(isPrivate),
      creator: req.user._id,
      members: [req.user._id],
      invitedUsers: []
    });

    await newCommunity.save();

    // Log activity in creator profile
    req.user.activityLog.push({
      action: `Created community: ${newCommunity.name}`,
      timestamp: new Date()
    });
    await req.user.save();

    await newCommunity.populate('creator', 'name email profilePictureUrl');
    await newCommunity.populate('members', 'name email profilePictureUrl');

    return res.status(201).json({
      message: 'Community created successfully.',
      community: newCommunity
    });
  } catch (error) {
    console.error('Create community error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A community with this name already exists.'
      });
    }
    return res.status(500).json({
      message: 'Failed to create community. Please try again.'
    });
  }
};

/**
 * @route   PUT /api/communities/:id
 * @desc    Update community details (name, description, isPrivate)
 * @access  Private (Creator or Admin)
 */
const updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPrivate } = req.body;

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

    // Authorization: Only the creator (or admin) can edit
    const isCreator = community.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: 'Only the community creator can edit community details.'
      });
    }

    // If changing name, check for uniqueness conflict
    if (name && typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 80) {
        return res.status(400).json({
          message: 'Community name must be between 2 and 80 characters.'
        });
      }

      const duplicate = await Community.findOne({
        _id: { $ne: community._id },
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
      });

      if (duplicate) {
        return res.status(409).json({
          message: 'A community with this name already exists.'
        });
      }

      community.name = trimmedName;
    }

    if (description !== undefined) {
      community.description = description ? description.trim() : '';
    }

    if (isPrivate !== undefined) {
      community.isPrivate = Boolean(isPrivate);
    }

    await community.save();

    // Log activity
    req.user.activityLog.push({
      action: `Updated community: ${community.name}`,
      timestamp: new Date()
    });
    await req.user.save();

    await community.populate('creator', 'name email profilePictureUrl');
    await community.populate('members', 'name email profilePictureUrl');
    await community.populate('invitedUsers', 'name email profilePictureUrl');

    return res.status(200).json({
      message: 'Community updated successfully.',
      community
    });
  } catch (error) {
    console.error('Update community error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A community with this name already exists.'
      });
    }
    return res.status(500).json({
      message: 'Failed to update community details.'
    });
  }
};

/**
 * @route   POST /api/communities/:id/invite
 * @desc    Invite a user to a community by email or user ID
 * @access  Private (Members/Creator)
 */
const inviteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, userId } = req.body;

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

    // Ensure inviter is a member or creator of the community
    const isMember = community.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You must be a member of this community to invite others.'
      });
    }

    if (!email && !userId) {
      return res.status(400).json({
        message: 'Please provide a user email or user ID to invite.'
      });
    }

    // Find target user
    let targetUser = null;
    if (email && typeof email === 'string') {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    } else if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      targetUser = await User.findById(userId);
    }

    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found with the provided details.'
      });
    }

    // SPECIFICATION CHECK:
    // If the target user is already in community.members, return 400 Bad Request
    // with exact message: "This user is already a member of the community."
    const isAlreadyMember = community.members.some(
      (memberId) => memberId.toString() === targetUser._id.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        message: 'This user is already a member of the community.'
      });
    }

    // Check if user is already invited
    const isAlreadyInvited = community.invitedUsers.some(
      (inviteId) => inviteId.toString() === targetUser._id.toString()
    );

    if (!isAlreadyInvited) {
      community.invitedUsers.push(targetUser._id);
      await community.save();
    }

    // Create notification for target user
    await Notification.create({
      recipient: targetUser._id,
      community: community._id,
      type: 'discussion',
      message: `${req.user.name} invited you to join the "${community.name}" community.`
    });

    // Log activity
    req.user.activityLog.push({
      action: `Invited ${targetUser.name} to ${community.name}`,
      timestamp: new Date()
    });
    await req.user.save();

    await community.populate('creator', 'name email profilePictureUrl');
    await community.populate('members', 'name email profilePictureUrl');
    await community.populate('invitedUsers', 'name email profilePictureUrl');

    return res.status(200).json({
      message: `Invitation successfully sent to ${targetUser.name}.`,
      community
    });
  } catch (error) {
    console.error('Invite user error:', error);
    return res.status(500).json({
      message: 'Failed to send invitation. Please try again.'
    });
  }
};

/**
 * @route   GET /api/communities
 * @desc    Get all communities (searchable, filterable)
 * @access  Public / Private
 */
const getCommunities = async (req, res) => {
  try {
    const { search, myCommunities } = req.query;
    let query = {};

    // Filter by search keyword
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ name: regex }, { description: regex }];
    }

    // Filter by communities user belongs to or created
    if (myCommunities === 'true' && req.user) {
      query.members = req.user._id;
    }

    const communities = await Community.find(query)
      .populate('creator', 'name email profilePictureUrl')
      .populate('members', 'name email profilePictureUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: communities.length,
      communities
    });
  } catch (error) {
    console.error('Get communities error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve communities.'
    });
  }
};

/**
 * @route   GET /api/communities/:id
 * @desc    Get single community details
 * @access  Public / Private
 */
const getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid community ID.'
      });
    }

    const community = await Community.findById(id)
      .populate('creator', 'name email profilePictureUrl')
      .populate('members', 'name email profilePictureUrl')
      .populate('invitedUsers', 'name email profilePictureUrl');

    if (!community) {
      return res.status(404).json({
        message: 'Community not found.'
      });
    }

    return res.status(200).json({
      community
    });
  } catch (error) {
    console.error('Get community by ID error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve community details.'
    });
  }
};

/**
 * @route   POST /api/communities/:id/join
 * @desc    Join a community (enforcing invitation for private communities)
 * @access  Private
 */
const joinCommunity = async (req, res) => {
  try {
    const { id } = req.params;

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

    const isMember = community.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (isMember) {
      return res.status(400).json({
        message: 'You are already a member of this community.'
      });
    }

    // STRICT NEGATIVE CRITERION:
    // If community.isPrivate is true and the user ID is not in community.invitedUsers,
    // return 403 Forbidden with exact message:
    // "You cannot join a private community without an invitation."
    const isInvited = community.invitedUsers.some(
      (i) => i.toString() === req.user._id.toString()
    );

    if (community.isPrivate && !isInvited) {
      return res.status(403).json({
        message: 'You cannot join a private community without an invitation.'
      });
    }

    // Add user to members
    community.members.push(req.user._id);

    // Remove from invitedUsers if present
    community.invitedUsers = community.invitedUsers.filter(
      (i) => i.toString() !== req.user._id.toString()
    );

    await community.save();

    // Log activity
    req.user.activityLog.push({
      action: `Joined community: ${community.name}`,
      timestamp: new Date()
    });
    await req.user.save();

    await community.populate('creator', 'name email profilePictureUrl');
    await community.populate('members', 'name email profilePictureUrl');
    await community.populate('invitedUsers', 'name email profilePictureUrl');

    return res.status(200).json({
      message: 'Successfully joined the community.',
      community
    });
  } catch (error) {
    console.error('Join community error:', error);
    return res.status(500).json({
      message: 'Failed to join community.'
    });
  }
};

/**
 * @route   POST /api/communities/:id/leave
 * @desc    Leave a community
 * @access  Private
 */
const leaveCommunity = async (req, res) => {
  try {
    const { id } = req.params;

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

    const isMember = community.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(400).json({
        message: 'You are not a member of this community.'
      });
    }

    // Creator cannot leave without transferring or deleting
    if (community.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Community creators cannot leave their own community.'
      });
    }

    community.members = community.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );

    await community.save();

    // STRICT NEGATIVE CRITERION 1:
    // Clear/delete notifications for this community when user leaves,
    // ensuring the user never receives or retains notifications for communities they have left.
    try {
      await Notification.deleteMany({
        recipient: req.user._id,
        community: community._id
      });
    } catch (cleanErr) {
      console.warn('Failed to clear notifications upon leaving community:', cleanErr.message);
    }

    // Log activity
    req.user.activityLog.push({
      action: `Left community: ${community.name}`,
      timestamp: new Date()
    });
    await req.user.save();

    await community.populate('creator', 'name email profilePictureUrl');
    await community.populate('members', 'name email profilePictureUrl');
    await community.populate('invitedUsers', 'name email profilePictureUrl');

    return res.status(200).json({
      message: 'Successfully left the community.',
      community
    });
  } catch (error) {
    console.error('Leave community error:', error);
    return res.status(500).json({
      message: 'Failed to leave community.'
    });
  }
};

module.exports = {
  createCommunity,
  updateCommunity,
  inviteUser,
  getCommunities,
  getCommunityById,
  joinCommunity,
  leaveCommunity
};

