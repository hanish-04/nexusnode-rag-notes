// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  chatWithNotes,
  getChatHistory,
  getChatList,
  createChat,
  renameChat,
  deleteChat,
  clearChatHistory,
} = require('../controllers/aiController');

router.use(authMiddleware);

router.get('/chat', getChatList);
router.get('/chat/history', getChatHistory);
router.post('/chat', chatWithNotes);
router.post('/chat/new', createChat);
router.put('/chat/:chatId', renameChat);
router.delete('/chat/:chatId', deleteChat);
router.delete('/chat/history', clearChatHistory);

module.exports = router;