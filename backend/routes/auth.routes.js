const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/register/shop', authController.registerShop);
router.post('/register/driver', authController.registerDriver);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.post('/change-password', authenticate, authController.changePassword);

// PATCH /profile/lang - update user's language
router.patch('/profile/lang', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    let { lang } = req.body;
    if (!lang || !['en', 'ar', 'EN', 'AR'].includes(lang)) {
      return res.status(400).json({ message: 'Invalid language' });
    }
    lang = lang.toUpperCase();
    const user = await require('../models').User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.lang = lang;
    await user.save();
    res.json({ message: 'Language updated', lang: user.lang });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update language', error: error.message });
  }
});

module.exports = router;
