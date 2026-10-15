const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, uploadProfileImage, updateProfile);

module.exports = router;
