import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkLoggedIn = async () => {
        try {
          setLoading(true);
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('currentUser');
        
        if (!token) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        // First set the stored user if available
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }

        // Then verify with the server
          const response = await authService.getProfile();
        const userData = response.data;
        
        // Update stored user data
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setCurrentUser(userData);
        } catch (err) {
        console.error('Error in auth check:', err);
        // Only clear auth data if it's an auth error
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      // Using real API call for all environments
      const response = await authService.login(credentials);
      
      const { token, ...userData } = response.data;
      
      // Check if user is a shop and is approved
      if (userData.role === 'shop' && !userData.isApproved) {
        setError('Your shop account is pending approval. Please wait for an administrator to approve your account.');
        throw new Error('Shop account pending approval');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData, userType = 'user') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Attempting to register ${userType} with data:`, userData);
      
      // Use real API endpoints for all environments
      let response;
      
      // Call the appropriate API endpoint based on user type
      switch(userType) {
        case 'shop':
          response = await authService.registerShop(userData);
          break;
        case 'driver':
          response = await authService.registerDriver(userData);
          break;
        default:
          response = await authService.register(userData);
      }
      
      console.log('Registration successful, response:', response.data);
      
      const { token, ...newUserData } = response.data;
      localStorage.setItem('token', token);
      setCurrentUser(newUserData);
      return newUserData;
    } catch (err) {
      console.error('Registration error:', err);
      
      // Provide more detailed error information
      const errorMessage = err.response?.data?.message || 'Registration failed';
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: errorMessage
      });
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  // Provide auth context values
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
