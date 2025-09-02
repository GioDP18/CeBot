const express = require('express');
const router = express.Router();
const dialogflowController = require('../controllers/dialogflowController');

// Chat endpoint for Dialogflow integration
router.post('/message', dialogflowController.processMessage);

// Get chat history
router.get('/history', dialogflowController.getChatHistory);

// Clear chat history
router.delete('/history', dialogflowController.clearChatHistory);

module.exports = router;
