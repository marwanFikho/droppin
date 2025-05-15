const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { sequelize, testConnection } = require('./config/db.config');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const shopRoutes = require('./routes/shop.routes');
const driverRoutes = require('./routes/driver.routes');
const packageRoutes = require('./routes/package.routes');
const adminRoutes = require('./routes/admin.routes');
const infoRoutes = require('./routes/info.routes');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/info', infoRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to Droppin Delivery API');
});

// Create the database directory if it doesn't exist
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Import all models to ensure they're loaded properly
    const { User, Shop, Driver, Package } = require('./models/index');
    
    // Sync database to alter existing tables
    // Only use force in development mode, not production
    console.log('Synchronizing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
    
    // Create default admin user if it doesn't exist
    const adminEmail = 'admin@dropin.com';
    const admin = await User.findOne({ where: { email: adminEmail } });
    
    if (!admin) {
      console.log('Creating default admin user...');
      await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'password', // Will be hashed by the model hooks
        phone: '1234567890',
        role: 'admin',
        isApproved: true,
        isActive: true
      });
      console.log('Admin user created');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

// Start the server
startServer();
