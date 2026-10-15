const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllCommunities,
  updateUser,
  deleteUser,
  updateCommunity,
  deleteCommunity
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

// Protect all admin routes with authentication and admin role requirement
router.use(protect, requireAdmin);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Community management routes
router.get('/communities', getAllCommunities);
router.put('/communities/:id', updateCommunity);
router.delete('/communities/:id', deleteCommunity);

module.exports = router;
