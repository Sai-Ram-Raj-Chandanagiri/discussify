const { User } = require('../models');

/**
 * @route   GET /api/users/profile
 * @desc    Get authenticated user's profile and activityLog
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
        notificationSettings: user.notificationSettings,
        activityLog: user.activityLog,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve profile details.'
    });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile (name, bio, profilePicture)
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: 'User profile not found.'
      });
    }

    // STRICT NEGATIVE CRITERIA:
    // Explicitly reject or strip any attempt to modify email.
    // If req.body.email differs from the existing email, return 400 Bad Request with exact message:
    // "Email address cannot be edited."
    if (
      req.body.email !== undefined &&
      req.body.email.toLowerCase().trim() !== user.email.toLowerCase().trim()
    ) {
      return res.status(400).json({
        message: 'Email address cannot be edited.'
      });
    }

    // Always strip email from any update payload
    delete req.body.email;

    const { name, bio } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          message: 'Name cannot be empty.'
        });
      }
      user.name = name.trim();
    }

    if (bio !== undefined) {
      if (typeof bio === 'string' && bio.length > 500) {
        return res.status(400).json({
          message: 'Bio cannot exceed 500 characters.'
        });
      }
      user.bio = typeof bio === 'string' ? bio.trim() : '';
    }

    // If a new profile picture was uploaded
    if (req.file) {
      const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
      user.profilePictureUrl = `${serverUrl}/uploads/${req.file.filename}`;
    }

    // Record activity log
    user.activityLog.push({
      action: 'Updated profile details',
      timestamp: new Date()
    });

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
        notificationSettings: user.notificationSettings,
        activityLog: user.activityLog,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      message: 'Failed to update profile.'
    });
  }
};

/**
 * @route   PUT /api/users/notification-settings
 * @desc    Update user notification preferences
 * @access  Private
 */
const updateNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: 'User profile not found.'
      });
    }

    const { newDiscussions, newResources } = req.body;

    const currentDiscussions = user.notificationSettings?.newDiscussions !== false;
    const currentResources = user.notificationSettings?.newResources !== false;

    const parseBooleanParam = (value, fallback) => {
      if (value === undefined || value === null) return fallback;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const val = value.trim().toLowerCase();
        if (val === 'false' || val === '0') return false;
        if (val === 'true' || val === '1') return true;
      }
      return Boolean(value);
    };

    const targetDiscussions = parseBooleanParam(newDiscussions, currentDiscussions);
    const targetResources = parseBooleanParam(newResources, currentResources);

    // STRICT NEGATIVE CRITERION 2:
    // Users must not be able to turn off all notifications. If a user attempts to set both
    // newDiscussions: false and newResources: false, return 400 Bad Request with
    // "You cannot turn off all notifications. At least one notification type must remain enabled."
    if (!targetDiscussions && !targetResources) {
      return res.status(400).json({
        message: 'You cannot turn off all notifications. At least one notification type must remain enabled.'
      });
    }

    user.notificationSettings = {
      newDiscussions: targetDiscussions,
      newResources: targetResources
    };

    user.activityLog.push({
      action: 'Updated notification settings',
      timestamp: new Date()
    });

    await user.save();

    return res.status(200).json({
      message: 'Notification settings updated successfully.',
      notificationSettings: user.notificationSettings,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
        notificationSettings: user.notificationSettings,
        activityLog: user.activityLog,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return res.status(500).json({
      message: error.message || 'Failed to update notification settings.'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateNotificationSettings
};

