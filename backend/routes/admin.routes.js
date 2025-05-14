const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// Admin routes - all require admin role
router.use(authenticate, authorize('admin'));

// Dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/pending', adminController.getPendingApprovals);
router.patch('/users/:id/approve', adminController.approveUser);

// Shop management
router.get('/shops', adminController.getShops);
router.patch('/shops/:id/approve', adminController.approveShop);

// Driver management
router.get('/drivers', adminController.getDrivers);
router.patch('/drivers/:id/approve', adminController.approveDriver);

// Package management
router.get('/packages', adminController.getPackages);

module.exports = router;
