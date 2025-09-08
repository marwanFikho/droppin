const { Notification } = require('../models');
const { Op } = require('sequelize');

// Get notifications for a user (by authenticated user)
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.role;

    if (!userId || !userType) {
      return res.status(401).json({ message: 'Authentication required' });
    }

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

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications', error: err.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.role;
    const { id } = req.params;

    if (!userId || !userType) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const notification = await Notification.findByPk(id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (userType !== 'admin') {
      if (notification.userId !== userId || notification.userType !== userType) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else {
      // Admin can only update admin notifications
      if (notification.userType !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

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
    const userId = req.user?.id;
    const userType = req.user?.role;

    if (!userId || !userType) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let where;
    if (userType === 'admin') {
      where = { userType: 'admin', isRead: false };
    } else if (userType === 'shop' || userType === 'driver') {
      where = { userId, userType, isRead: false };
    } else {
      return res.json({ success: true });
    }

    await Notification.update(
      { isRead: true },
      { where }
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
    const userId = req.user?.id;
    const userType = req.user?.role;
    const { id } = req.params;

    if (!userId || !userType) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const notification = await Notification.findByPk(id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (userType !== 'admin') {
      if (notification.userId !== userId || notification.userType !== userType) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else {
      if (notification.userType !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    await notification.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting notification', error: err.message });
  }
};

// Delete all notifications for the current user
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.role;

    if (!userId || !userType) {
      return res.status(401).json({ message: 'Authentication required' });
    }

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