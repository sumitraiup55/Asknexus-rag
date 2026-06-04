const express = require("express");

const {
  askQuestion,
  getUserChatSessions,
  getChatSessionMessages,
  deleteChatSession,
  askTestQuestion,
} = require("../controllers/chat.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * Temporary test route
 * You can remove this later.
 */
router.post("/test-ask", askTestQuestion);

/**
 * All real chat routes are protected
 */
router.use(protect);

/**
 * Ask question with optional sessionId
 * If sessionId exists: continue old chat
 * If sessionId missing: create new chat session
 */
router.post("/ask", askQuestion);

/**
 * Get all old sessions of logged-in user
 */
router.get("/sessions", getUserChatSessions);

/**
 * Get one session's full message history
 */
router.get("/sessions/:sessionId", getChatSessionMessages);

/**
 * Delete complete session and all messages
 */
router.delete("/sessions/:sessionId", deleteChatSession);

module.exports = router;