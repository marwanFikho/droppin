const { User, Shop, Driver, Package } = require('../models/index');

// Simple placeholder controller for testing
exports.getInfo = async (req, res) => {
  try {
    const usersCount = await User.count();
    const shopsCount = await Shop.count();
    const driversCount = await Driver.count();
    const packagesCount = await Package.count();

    res.json({
      message: 'Droppin Delivery API is working',
      counts: {
        users: usersCount,
        shops: shopsCount,
        drivers: driversCount,
        packages: packagesCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
