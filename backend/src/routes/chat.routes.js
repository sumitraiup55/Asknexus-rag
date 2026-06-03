const express = require("express");

const {
  askQuestion,
  askTestQuestion,
} = require("../controllers/chat.controller");

const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// Real protected RAG chat route
router.post("/ask", protect, askQuestion);

// Temporary route for test-org data
// Delete this after real document upload with logged-in user is ready
router.post("/test-ask", askTestQuestion);

module.exports = router;