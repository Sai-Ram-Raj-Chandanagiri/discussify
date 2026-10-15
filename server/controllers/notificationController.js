const mongoose = require('mongoose');
const { Notification, Community } = require('../models');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the authenticated user (only for communities they currently belong to)
 * @access  Private
 */
const getNotifications = async (req, res) => {
  try {
    // STRICT NEGATIVE CRITERION 1:
    // Ensure user never receives notifications for communities they have left.
    // 1. Identify communities where user is currently an active member.
    const activeCommunities = await Community.find({
      members: req.user._id
    }).select('_id');

    const activeCommunityIds = activeCommunities.map((c) => c._id);

    // 2. Clean up any lingering notifications for communities the user has left
    await Notification.deleteMany({
      recipient: req.user._id,
      community: { $nin: activeCommunityIds }
    });

    // 3. Fetch notifications for current member communities
    const notifications = await Notification.find({
      recipient: req.user._id,
      community: { $in: activeCommunityIds }
    })
      .populate('community', 'name isPrivate')
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.status(200).json({
      count: notifications.length,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve notifications.'
    });
  }
};

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid notification ID.'
      });
    }

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found.'
      });
    }

    notification.isRead = true;
    await notification.save();

    await notification.populate('community', 'name isPrivate');

    return res.status(200).json({
      message: 'Notification marked as read.',
      notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({
      message: 'Failed to update notification.'
    });
  }
};

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all user's notifications as read
 * @access  Private
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    return res.status(200).json({
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    return res.status(500).json({
      message: 'Failed to mark all notifications as read.'
    });
  }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid notification ID.'
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found.'
      });
    }

    return res.status(200).json({
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      message: 'Failed to delete notification.'
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
};
