const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { Package } = require('../models');
const { formatDateTimeToDDMMYYYY, getCairoDateTime } = require('../utils/dateUtils');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Notification routes
router.get('/notifications', authenticate, notificationController.getNotifications);
router.post('/notifications/:id/read', authenticate, notificationController.markAsRead);
router.post('/notifications/mark-all-read', authenticate, notificationController.markAllAsRead);
router.delete('/notifications/:id', authenticate, notificationController.deleteNotification);
router.delete('/notifications', authenticate, notificationController.deleteAllNotifications);

module.exports = router; 