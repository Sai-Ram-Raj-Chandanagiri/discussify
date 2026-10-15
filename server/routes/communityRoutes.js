const express = require('express');
const router = express.Router();
const {
  createCommunity,
  updateCommunity,
  inviteUser,
  getCommunities,
  getCommunityById
} = require('../controllers/communityController');
const { protect } = require('../middleware/auth');

router.get('/', getCommunities);
router.get('/:id', getCommunityById);
router.post('/', protect, createCommunity);
router.put('/:id', protect, updateCommunity);
router.post('/:id/invite', protect, inviteUser);

module.exports = router;
