const { Notification } = require('../models');
const { Op } = require('sequelize');

// Get notifications for a user (by userId and userType)
exports.getNotifications = async (req, res) => {
  try {
    const { userId, userType } = req;

    let where = {};
    if (userType === 'admin') {
      // Admin sees all admin notifications
      where = { userType: 'admin' };
    } else if (userType === 'shop' || userType === 'driver') {
      // Shop/Driver sees only their own notifications
      where = { userType, userId };
    } else {
      // Other user types: return nothing
      return res.json([]);
    }

    // Debug logging
    console.log('Fetching notifications:', { userId, userType, where });

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    console.log('Notifications found:', notifications.length);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    notification.isRead = true;
    await notification.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification', error: err.message });
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId, userType } = req;
    await Notification.update(
      { isRead: true },
      { where: { userId, userType, isRead: false } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error marking all notifications as read', error: err.message });
  }
};

// Create a notification (utility for backend use)
exports.createNotification = async ({ userId, userType, title, message, data }) => {
  return Notification.create({ userId, userType, title, message, data });
};

// Delete a notification by ID for the current user
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req;
    const notification = await Notification.findOne({ where: { id, userId, userType } });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    await notification.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting notification', error: err.message });
  }
};

// Delete all notifications for the current user
exports.deleteAllNotifications = async (req, res) => {
  try {
    const { userId, userType } = req;
    let where = {};
    if (userType === 'admin') {
      where = { userType: 'admin' };
    } else if (userType === 'shop' || userType === 'driver') {
      where = { userType, userId };
    } else {
      return res.json({ success: true });
    }
    await Notification.destroy({ where });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting all notifications', error: err.message });
  }
}; 