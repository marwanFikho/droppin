const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

// Admin routes - all require admin role
router.use(authenticate, authorize('admin'));

// Dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// Recent activities
router.get('/activities', adminController.getRecentActivities);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/pending', adminController.getPendingApprovals);
router.patch('/users/:id/approve', adminController.approveUser);
router.delete('/users/:id', adminController.deleteUser);

// Shop management
router.get('/shops', adminController.getShops);
router.get('/shops/:id', adminController.getShopById);
router.get('/shops/:id/stats', adminController.getShopStats);
router.patch('/shops/:id/approve', adminController.approveShop);
router.patch('/shops/:id', adminController.updateShop);
router.post('/shops/:id/adjust-total-collected', adminController.adjustShopTotalCollected);

// Driver management
router.get('/drivers', adminController.getDrivers);
router.patch('/drivers/:id/approve', adminController.approveDriver);
router.post('/drivers/:id/give-money', adminController.giveMoneyToDriver);
router.post('/drivers/:id/reset-cash', adminController.resetDriverCashOnHand);

// Package management
router.get('/packages', adminController.getPackages);
router.post('/packages/:packageId/assign-driver', adminController.assignDriverToPackage);
router.patch('/packages/:packageId/payment', adminController.updatePackagePayment);
router.put('/packages/:id', adminController.updatePackage);
router.delete('/packages/:id', adminController.deletePackage);

// Financial management
router.post('/shops/:shopId/settle-payments', adminController.settleShopPayments);

// Money transactions
router.get('/money', adminController.getMoneyTransactions);

// Analytics endpoints for dashboard graphs
router.get('/analytics/packages-per-month', adminController.getPackagesPerMonth);
router.get('/analytics/cod-per-month', adminController.getCodCollectedPerMonth);
router.get('/analytics/package-status-distribution', adminController.getPackageStatusDistribution);
router.get('/analytics/top-shops', adminController.getTopShops);
router.get('/analytics/recent-packages', adminController.getRecentPackagesData);
router.get('/analytics/recent-cod', adminController.getRecentCodData);

module.exports = router;
