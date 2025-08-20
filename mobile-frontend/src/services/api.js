import axios from 'axios';
import { getToken } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// const API_URL = process.env.REACT_APP_API_URL || 'https://api.droppin-eg.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response;
  },
  register: (userData) => api.post('/auth/register', userData),
  registerShop: (shopData) => api.post('/auth/register/shop', shopData),
  registerDriver: (driverData) => api.post('/auth/register/driver', driverData),
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response;
  },
  changePassword: ({ currentPassword, newPassword }) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Package service
export const packageService = {
  createPackage: (packageData) => {
    return api.post('/packages', packageData);
  },
  
  getPackages: (filters = {}) => {
    return api.get('/packages', { params: filters });
  },
  
  getPackageById: (id) => {
    return api.get(`/packages/${id}`);
  },
  
  updatePackage: (id, packageData) => {
    return api.put(`/packages/${id}`, packageData);
  },
  
  updatePackageStatus: (id, statusData) => {
    return api.patch(`/packages/${id}/status`, statusData);
  },
  
  trackPackage: (trackingNumber) => {
    return api.get(`/packages/track/${trackingNumber}`);
  },
  getShopProfile: () => api.get('/shops/profile'),
  updateShopProfile: (data) => api.put('/shops/profile', data),
  cancelPackage: (id) => {
    return api.patch(`/packages/${id}/cancel`);
  },
  createPickup: (pickupData) => {
    return api.post('/pickups', pickupData);
  },
  getShopPickups: () => api.get('/pickups/shop'),
  getPickupById: (id) => api.get(`/pickups/${id}`),
  cancelPickup: (pickupId) => api.patch(`/pickups/${pickupId}/cancel`),
  getMoneyTransactions: (params = {}) => api.get('/shops/money-transactions', { params }),
  updatePackageNotes: (id, note) => {
    return api.patch(`/packages/${id}/notes`, { note });
  },
  // Request return for a delivered package
  requestReturn: (id, data) => {
    return api.post(`/packages/${id}/request-return`, data);
  },
  generateShopApiKey: () => api.post('/shops/generate-api-key'),
};

// Shop service
export const shopService = {
  getShops: () => api.get('/shops'),
  getShopById: (id) => api.get(`/shops/${id}`),
};

// User service
export const userService = {
  updateLanguage: (lang) => api.patch('/auth/profile/lang', { lang: lang.toUpperCase() }),
};

// Driver service
export const driverService = {
  getDrivers: () => api.get('/drivers'),
  getDriverById: (id) => api.get(`/drivers/${id}`),
  updateLocation: (data) => api.post('/drivers/location', data),
  getDriverProfile: () => api.get('/drivers/profile'),
  updateAvailability: (isAvailable) => api.patch('/drivers/availability', { isAvailable }),
  updateLanguage: (lang) => api.patch('/auth/profile/lang', { lang: lang.toUpperCase() }),
};

// Admin service
export const adminService = {
  // Dashboard statistics
  getDashboardStats: () => api.get('/admin/stats'),
  
  // User management
  getUsers: (filters = {}) => api.get('/admin/users', { params: filters }),
  getPendingApprovals: () => api.get('/admin/users/pending'),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  approveUser: (id, approved) => api.patch(`/admin/users/${id}/approve`, { approved }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Shop management
  getShops: (filters = {}) => api.get('/admin/shops', { params: filters }),
  getShopById: (id) => api.get(`/admin/shops/${id}`),
  approveShop: (id, approved) => api.patch(`/admin/shops/${id}/approve`, { approved }),
  updateShop: (id, data) => api.patch(`/admin/shops/${id}`, data),
  adjustShopTotalCollected: (shopId, data) => api.post(`/admin/shops/${shopId}/adjust-total-collected`, data),
  
  // Driver management
  getDrivers: (filters = {}) => api.get('/admin/drivers', { params: filters }),
  approveDriver: (id, approved) => api.patch(`/admin/drivers/${id}/approve`, { approved }),
  updateDriverWorkingArea: (driverId, workingArea) => api.patch(`/drivers/${driverId}/working-area`, { workingArea }),
  giveMoneyToDriver: (driverId, data) => api.post(`/admin/drivers/${driverId}/give-money`, data),
  
  // Package management
  getPackages: (filters = {}) => api.get('/admin/packages', { params: filters }),
  assignDriverToPackage: (packageId, driverId) => {
    console.log('API call - assignDriverToPackage:', { packageId, driverId });
    return api.post(`/admin/packages/${packageId}/assign-driver`, { driverId });
  },
  updatePackage: (id, data) => api.put(`/admin/packages/${id}`, data),
  
  // Pickup management
  getAllPickups: () => api.get('/pickups/admin/all'),
  markPickupAsPickedUp: (pickupId) => api.patch(`/pickups/${pickupId}/pickup`),
  assignDriverToPickup: (pickupId, driverId) => api.patch(`/pickups/admin/pickups/${pickupId}/assign-driver`, { driverId }),
  updatePickupStatus: (pickupId, status) => api.patch(`/pickups/admin/pickups/${pickupId}/status`, { status }),
  // Financial management
  settleShopPayments: (shopId, data) => api.post(`/admin/shops/${shopId}/settle-payments`, data),
  updatePackagePayment: (packageId, data) => api.patch(`/admin/packages/${packageId}/payment`, data),
  getShopPackages: (shopId) => api.get(`/admin/packages`, { params: { shopId } }),
  getMoneyTransactions: (params = {}) => api.get('/admin/money', { params }),
  getRecentActivities: () => api.get('/admin/activities'),
};

export const pickupService = {
  getDriverPickups: () => api.get('/pickups/driver'),
  markPickupAsPickedUp: (pickupId) => api.patch(`/pickups/driver/${pickupId}/pickup`),
};

// Add notification API methods
export const notificationService = {
  getNotifications: (userId, userType) =>
    api.get('/notifications', {
      headers: {
        'x-user-id': userId,
        'x-user-type': userType,
      },
    }),
  markAllRead: (userId, userType) =>
    api.post('/notifications/mark-all-read', {}, {
      headers: {
        'x-user-id': userId,
        'x-user-type': userType,
      },
    }),
  deleteNotification: (id, userId, userType) =>
    api.delete(`/notifications/${id}`, {
      headers: {
        'x-user-id': userId,
        'x-user-type': userType,
      },
    }),
  deleteAll: (userId, userType) =>
    api.delete('/notifications', {
      headers: {
        'x-user-id': userId,
        'x-user-type': userType,
      },
    }),
};

export default api;
