const express = require('express');
const router = express.Router();
const {
  replyDiscussion,
  getDiscussionById
} = require('../controllers/discussionController');
const { protect } = require('../middleware/auth');

router.get('/:discussionId', getDiscussionById);
router.post('/:discussionId/replies', protect, replyDiscussion);

module.exports = router;
