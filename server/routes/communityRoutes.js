const express = require('express');
const router = express.Router();
const {
  createCommunity,
  updateCommunity,
  inviteUser,
  getCommunities,
  getCommunityById,
  joinCommunity,
  leaveCommunity
} = require('../controllers/communityController');
const {
  createDiscussion,
  getDiscussionsByCommunity
} = require('../controllers/discussionController');
const { protect } = require('../middleware/auth');

router.get('/', getCommunities);
router.get('/:id', getCommunityById);
router.post('/', protect, createCommunity);
router.put('/:id', protect, updateCommunity);
router.post('/:id/invite', protect, inviteUser);
router.post('/:id/join', protect, joinCommunity);
router.post('/:id/leave', protect, leaveCommunity);
router.post('/:id/Leave', protect, leaveCommunity);

// Community Discussions
router.get('/:id/discussions', getDiscussionsByCommunity);
router.post('/:id/discussions', protect, createDiscussion);

module.exports = router;
