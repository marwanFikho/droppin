const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    console.log('[DEBUG] Auth middleware: incoming request', req.method, req.originalUrl);
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('[DEBUG] Auth middleware: token:', token);
    
    if (!token) {
      console.log('[DEBUG] Auth middleware: No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[DEBUG] Auth middleware: token decoded:', decoded);
    } catch (err) {
      console.log('[DEBUG] Auth middleware: Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token: ' + err.message });
    }
    
    // Find user
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      console.log('[DEBUG] Auth middleware: User not found for id:', decoded.id);
      return res.status(401).json({ message: 'Invalid token: User not found' });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('[DEBUG] Auth middleware: User is not active:', user.id);
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    // Set user to req object
    req.user = user;
    console.log('[DEBUG] Auth middleware: Authenticated user:', user.id, user.role);
    next();
  } catch (error) {
    console.log('[DEBUG] Auth middleware: General error:', error.message);
    return res.status(401).json({ message: 'Invalid token: ' + error.message });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    next();
  };
};
