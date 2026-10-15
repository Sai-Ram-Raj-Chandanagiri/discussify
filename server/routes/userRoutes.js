const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateNotificationSettings } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, uploadProfileImage, updateProfile);
router.put('/notification-settings', protect, updateNotificationSettings);

module.exports = router;
