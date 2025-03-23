const express = require('express');
const router = express.Router();
const { 
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  getUnreadCount
} = require('../controllers/Message.controller');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:id', getMessages);
router.post('/conversations', createConversation);
router.post('/conversations/:id', sendMessage);
router.get('/unread', getUnreadCount);

module.exports = router;