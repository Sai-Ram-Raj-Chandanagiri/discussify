const mongoose = require('mongoose');
const { User, Community, Discussion, Resource, Notification } = require('../models');

// Helper to escape special regex characters for case-insensitive matching
const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * @route   GET /api/admin/users
 * @desc    List all users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Admin getAllUsers error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve users.'
    });
  }
};

/**
 * @route   GET /api/admin/communities
 * @desc    List all communities with active discussion counts
 * @access  Private (Admin only)
 */
const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .populate('creator', 'name email profilePictureUrl')
      .populate('members', 'name email profilePictureUrl')
      .sort({ createdAt: -1 });

    const communitiesWithStats = await Promise.all(
      communities.map(async (c) => {
        const activeDiscussionsCount = await Discussion.countDocuments({
          community: c._id,
          status: 'active'
        });
        const totalDiscussionsCount = await Discussion.countDocuments({
          community: c._id
        });
        const resourcesCount = await Resource.countDocuments({
          community: c._id
        });

        return {
          ...c.toObject(),
          activeDiscussionsCount,
          totalDiscussionsCount,
          resourcesCount
        };
      })
    );

    return res.status(200).json({
      count: communitiesWithStats.length,
      communities: communitiesWithStats
    });
  } catch (error) {
    console.error('Admin getAllCommunities error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve communities.'
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Allow admin to edit user details (name, bio, role)
 * @access  Private (Admin only)
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid user ID.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    // STRICT NEGATIVE CRITERION:
    // If the request attempts to change email, reject with 400 Bad Request
    // "Admins are not permitted to edit a user's email address."
    if (
      req.body.email !== undefined &&
      req.body.email.toLowerCase().trim() !== targetUser.email.toLowerCase().trim()
    ) {
      return res.status(400).json({
        message: "Admins are not permitted to edit a user's email address."
      });
    }

    // Always strip email from any update payload
    delete req.body.email;

    const { name, bio, role } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          message: 'Name cannot be empty.'
        });
      }
      targetUser.name = name.trim();
    }

    if (bio !== undefined) {
      if (typeof bio === 'string' && bio.length > 500) {
        return res.status(400).json({
          message: 'Bio cannot exceed 500 characters.'
        });
      }
      targetUser.bio = typeof bio === 'string' ? bio.trim() : '';
    }

    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
          message: 'Role must be either user or admin.'
        });
      }
      targetUser.role = role;
    }

    targetUser.activityLog.push({
      action: `Profile updated by Admin (${req.user.name})`,
      timestamp: new Date()
    });

    await targetUser.save();

    const sanitizedUser = await User.findById(targetUser._id).select('-passwordHash');

    return res.status(200).json({
      message: 'User updated successfully.',
      user: sanitizedUser
    });
  } catch (error) {
    console.error('Admin updateUser error:', error);
    return res.status(500).json({
      message: error.message || 'Failed to update user.'
    });
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user and remove them from community memberships
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid user ID.'
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    // Remove user from all community memberships and invitations
    await Community.updateMany(
      { members: targetUser._id },
      { $pull: { members: targetUser._id } }
    );
    await Community.updateMany(
      { invitedUsers: targetUser._id },
      { $pull: { invitedUsers: targetUser._id } }
    );

    // Clean up notifications for this user
    await Notification.deleteMany({ recipient: targetUser._id });

    // Delete the user record
    await User.findByIdAndDelete(targetUser._id);

    return res.status(200).json({
      message: 'User deleted successfully.'
    });
  } catch (error) {
    console.error('Admin deleteUser error:', error);
    return res.status(500).json({
      message: 'Failed to delete user.'
    });
  }
};

/**
 * @route   PUT /api/admin/communities/:id
 * @desc    Allow admin to edit community information
 * @access  Private (Admin only)
 */
const updateCommunity = async (req, res) => {
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

    const { name, description, isPrivate } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          message: 'Community name cannot be empty.'
        });
      }

      const trimmedName = name.trim();
      if (trimmedName.length < 2 || trimmedName.length > 80) {
        return res.status(400).json({
          message: 'Community name must be between 2 and 80 characters.'
        });
      }

      // If name is changing, check uniqueness
      if (trimmedName.toLowerCase() !== community.name.toLowerCase()) {
        const existing = await Community.findOne({
          _id: { $ne: community._id },
          name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') }
        });

        if (existing) {
          return res.status(409).json({
            message: 'A community with this name already exists.'
          });
        }
      }

      community.name = trimmedName;
    }

    if (description !== undefined) {
      if (typeof description === 'string' && description.length > 1000) {
        return res.status(400).json({
          message: 'Description cannot exceed 1000 characters.'
        });
      }
      community.description = typeof description === 'string' ? description.trim() : '';
    }

    if (isPrivate !== undefined) {
      community.isPrivate = Boolean(isPrivate);
    }

    await community.save();

    await community.populate('creator', 'name email profilePictureUrl');
    await community.populate('members', 'name email profilePictureUrl');

    return res.status(200).json({
      message: 'Community updated successfully.',
      community
    });
  } catch (error) {
    console.error('Admin updateCommunity error:', error);
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A community with this name already exists.'
      });
    }
    return res.status(500).json({
      message: error.message || 'Failed to update community.'
    });
  }
};

/**
 * @route   DELETE /api/admin/communities/:id
 * @desc    Delete a community
 * @access  Private (Admin only)
 */
const deleteCommunity = async (req, res) => {
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

    // STRICT NEGATIVE CRITERION:
    // First check if the community has any active discussions
    // (Discussion.exists({ community: id, status: 'active' })).
    // If true, abort deletion and return 400 Bad Request with
    // "Cannot delete a community that has active discussions."
    const hasActiveDiscussions = await Discussion.exists({
      community: id,
      status: 'active'
    });

    if (hasActiveDiscussions) {
      return res.status(400).json({
        message: 'Cannot delete a community that has active discussions.'
      });
    }

    // Cleanup community-related data: discussions, resources, notifications
    await Discussion.deleteMany({ community: community._id });
    await Resource.deleteMany({ community: community._id });
    await Notification.deleteMany({ community: community._id });

    // Delete community document
    await Community.findByIdAndDelete(community._id);

    return res.status(200).json({
      message: 'Community deleted successfully.'
    });
  } catch (error) {
    console.error('Admin deleteCommunity error:', error);
    return res.status(500).json({
      message: 'Failed to delete community.'
    });
  }
};

module.exports = {
  getAllUsers,
  getAllCommunities,
  updateUser,
  deleteUser,
  updateCommunity,
  deleteCommunity
};
