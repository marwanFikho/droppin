console.log('=== DROPPIN BACKEND SERVER STARTED ===');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { sequelize, testConnection } = require('./config/db.config');
const cron = require('node-cron');
const { Driver } = require('./models');

// Load environment variables
dotenv.config();

// Set default JWT_SECRET if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-secret-key-for-development';
  console.log('Warning: Using default JWT_SECRET. In production, set JWT_SECRET in .env file');
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Global request logger
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const shopRoutes = require('./routes/shop.routes');
const driverRoutes = require('./routes/driver.routes');
const packageRoutes = require('./routes/package.routes');
const adminRoutes = require('./routes/admin.routes');
const infoRoutes = require('./routes/info.routes');
const pickupRoutes = require('./routes/pickup.routes');
const itemRoutes = require('./routes/item.routes');
const apiRoutes = require('./routes/api.js');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api', apiRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to Droppin Delivery API');
});

// DOWNLOAD ROUTE
app.get('/download-db', (req, res) => {
  const dbPath = path.join(__dirname, 'db', 'dropin.sqlite');

  if (!fs.existsSync(dbPath)) {
    return res.status(404).send('Database file not found.');
  }

  res.download(dbPath, 'dropin.sqlite', (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Could not download the file');
    }
  });
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
    await testConnection();

    const { User, Shop, Driver, Package } = require('./models/index');

    // SQLite performance pragmas
    try {
      await sequelize.query("PRAGMA journal_mode=WAL;");
      await sequelize.query("PRAGMA synchronous=NORMAL;");
      await sequelize.query("PRAGMA temp_store=MEMORY;");
      await sequelize.query("PRAGMA cache_size=-20000;");
      console.log('Applied SQLite performance PRAGMAs');
    } catch (e) {
      console.warn('Failed to apply SQLite PRAGMAs:', e.message);
    }

    console.log('Synchronizing database models...');
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully');

    // Ensure helpful indexes exist (SQLite supports IF NOT EXISTS)
    try {
      await sequelize.query("CREATE INDEX IF NOT EXISTS idx_packages_status ON Packages (status)");
      await sequelize.query("CREATE INDEX IF NOT EXISTS idx_packages_shopId ON Packages (shopId)");
      await sequelize.query("CREATE INDEX IF NOT EXISTS idx_packages_driverId ON Packages (driverId)");
      await sequelize.query("CREATE INDEX IF NOT EXISTS idx_packages_createdAt ON Packages (createdAt)");
      await sequelize.query("CREATE INDEX IF NOT EXISTS idx_packages_actualDeliveryTime ON Packages (actualDeliveryTime)");
      await sequelize.query("ANALYZE;");
      console.log('Ensured indexes on Packages table');
    } catch (e) {
      console.warn('Failed to ensure indexes:', e.message);
    }

    const adminEmail = 'admin@dropin.com';
    const admin = await User.findOne({ where: { email: adminEmail } });
    console.log('Checking for existing admin user:', admin ? 'Found' : 'Not found');

    if (!admin) {
      console.log('Creating default admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password', salt);
      console.log('Generated hashed password for admin');
      
      const newAdmin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        phone: '1234567890',
        role: 'admin',
        isApproved: true,
        isActive: true
      });
      console.log('Admin user created successfully:', {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role,
        isApproved: newAdmin.isApproved,
        isActive: newAdmin.isActive
      });
    }

    // Reset assignedToday for all drivers at midnight every day
    cron.schedule('0 0 * * *', async () => {
      try {
        await Driver.update({ assignedToday: 0 }, { where: {} });
        console.log('Reset assignedToday for all drivers at midnight');
      } catch (error) {
        console.error('Error resetting assignedToday:', error);
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
