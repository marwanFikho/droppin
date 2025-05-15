import axios from 'axios';

// const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://droppin-production.up.railway.app';

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

// Authentication service
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  registerShop: (shopData) => api.post('/auth/register/shop', shopData),
  registerDriver: (driverData) => api.post('/auth/register/driver', driverData),
  getProfile: () => api.get('/auth/profile'),
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
  getShopProfile: () => api.get('/shops/profile')
};

// Shop service
export const shopService = {
  getShops: () => api.get('/shops'),
  getShopById: (id) => api.get(`/shops/${id}`),
};

// Driver service
export const driverService = {
  getDrivers: () => api.get('/drivers'),
  getDriverById: (id) => api.get(`/drivers/${id}`),
  updateLocation: (data) => api.post('/drivers/location', data),
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
  
  // Shop management
  getShops: (filters = {}) => api.get('/admin/shops', { params: filters }),
  getShopById: (id) => api.get(`/admin/shops/${id}`),
  approveShop: (id, approved) => api.patch(`/admin/shops/${id}/approve`, { approved }),
  
  // Driver management
  getDrivers: (filters = {}) => api.get('/admin/drivers', { params: filters }),
  approveDriver: (id, approved) => api.patch(`/admin/drivers/${id}/approve`, { approved }),
  
  // Package management
  getPackages: (filters = {}) => api.get('/admin/packages', { params: filters }),
  assignDriverToPackage: (packageId, driverId) => api.post(`/admin/packages/${packageId}/assign-driver`, { driverId }),
  
  // Financial management
  settleShopPayments: (shopId, data) => api.post(`/admin/shops/${shopId}/settle-payments`, data),
  updatePackagePayment: (packageId, data) => api.patch(`/admin/packages/${packageId}/payment`, data),
  getShopPackages: (shopId) => api.get(`/admin/packages`, { params: { shopId } }),
};

export default api;
