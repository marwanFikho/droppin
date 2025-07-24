const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { Package } = require('../models');
const { formatDateTimeToDDMMYYYY, getCairoDateTime } = require('../utils/dateUtils');
const notificationController = require('../controllers/notification.controller');

// Middleware to mock userId and userType for demonstration (replace with real auth in production)
router.use((req, res, next) => {
  // Example: set userId and userType from headers or session
  req.userId = req.headers['x-user-id'] || 1; // Replace with real user ID
  req.userType = req.headers['x-user-type'] || 'admin'; // Replace with real user type
  next();
});

// Notification routes
router.get('/notifications', notificationController.getNotifications);
router.post('/notifications/:id/read', notificationController.markAsRead);
router.post('/notifications/mark-all-read', notificationController.markAllAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);
router.delete('/notifications', notificationController.deleteAllNotifications);

module.exports = router; 