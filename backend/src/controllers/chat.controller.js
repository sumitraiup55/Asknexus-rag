const ChatSession = require("../models/chatSession.model");
const ChatMessage = require("../models/chatMessage.model");
const { askRagQuestion } = require("../services/rag.service");

/**
 * Create chat title from question
 */
const createSessionTitle = (question = "") => {
  const cleanedQuestion = question.replace(/\s+/g, " ").trim();

  if (!cleanedQuestion) {
    return "New Chat";
  }

  if (cleanedQuestion.length <= 60) {
    return cleanedQuestion;
  }

  return cleanedQuestion.slice(0, 60) + "...";
};

/**
 * Format RAG sources according to chatMessage model
 */
const formatSourcesForDB = (sources = []) => {
  return sources.map((source) => ({
    documentId: source.documentId || null,
    title: source.documentName || source.title || "Unknown Document",
    pageNumber: source.pageNumber || null,
    chunkIndex: source.chunkIndex ?? null,
    score: source.score ?? null,
    preview: source.preview || "",
  }));
};

/**
 * Format retrieved chunks according to chatMessage model
 */
const formatRetrievedChunksForDB = (retrievedChunks = []) => {
  return retrievedChunks.map((chunk) => ({
    documentId: chunk.documentId || null,
    documentName: chunk.documentName || "Unknown Document",
    chunkIndex: chunk.chunkIndex ?? null,
    score: chunk.score ?? null,
  }));
};

/**
 * POST /api/v1/chat/ask
 * Ask question, use previous 4-5 messages as chat context, save Q&A
 */
const askQuestion = async (req, res) => {
  try {
    const { question, sessionId, topK } = req.body;
    const user = req.user;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (!user.organizationId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked with any organization",
      });
    }

    let chatSession;

    /**
     * If sessionId exists, find only user's own session
     */
    if (sessionId) {
      chatSession = await ChatSession.findOne({
        _id: sessionId,
        userId: user._id,
        organizationId: user.organizationId,
      });

      if (!chatSession) {
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }
    }

    /**
     * If sessionId not provided, create new session
     */
    if (!chatSession) {
      chatSession = await ChatSession.create({
        userId: user._id,
        organizationId: user.organizationId,
        title: createSessionTitle(question),
        lastMessageAt: new Date(),
      });
    }

    /**
     * Get previous 5 messages from this session
     * Latest messages are fetched first, then reversed to keep correct order
     */
    const previousMessages = await ChatMessage.find({
      sessionId: chatSession._id,
      userId: user._id,
      organizationId: user.organizationId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const chatHistory = previousMessages.reverse();

    /**
    * Ask RAG service with secure organization, role, and department filters
    */
    const ragResult = await askRagQuestion({
     question,
     organizationId: String(user.organizationId),
     userRole: String(user.role || "").toLowerCase(),
     department: String(user.department || "general").toLowerCase(),
     topK: topK || 5,
     chatHistory,
    });

    /**
     * Save user message
     */
    const userMessage = await ChatMessage.create({
      sessionId: chatSession._id,
      userId: user._id,
      organizationId: user.organizationId,
      role: "user",
      question,
      answer: "",
      sources: [],
      retrievedChunks: [],
    });

    /**
     * Save assistant message
     */
    const assistantMessage = await ChatMessage.create({
      sessionId: chatSession._id,
      userId: user._id,
      organizationId: user.organizationId,
      role: "assistant",
      question: "",
      answer: ragResult.answer,
      sources: formatSourcesForDB(ragResult.sources),
      retrievedChunks: formatRetrievedChunksForDB(ragResult.retrievedChunks),
    });

    /**
     * Update session last message time
     */
    chatSession.lastMessageAt = new Date();

    /**
     * If session title is New Chat, update from first question
     */
    if (!chatSession.title || chatSession.title === "New Chat") {
      chatSession.title = createSessionTitle(question);
    }

    await chatSession.save();

    return res.status(200).json({
      success: true,
      message: "Answer generated and chat saved successfully",
      data: {
        session: {
          id: chatSession._id,
          title: chatSession.title,
          lastMessageAt: chatSession.lastMessageAt,
        },
        question,
        answer: ragResult.answer,
        sources: formatSourcesForDB(ragResult.sources),
        retrievedChunks: formatRetrievedChunksForDB(ragResult.retrievedChunks),
        messages: {
          userMessage,
          assistantMessage,
        },
      },
    });
  } catch (error) {
    console.error("Ask Question Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/v1/chat/sessions
 * Fetch all chat sessions of logged-in user
 */
const getUserChatSessions = async (req, res) => {
  try {
    const user = req.user;

    const sessions = await ChatSession.find({
      userId: user._id,
      organizationId: user.organizationId,
    })
      .sort({ lastMessageAt: -1 })
      .select("title lastMessageAt createdAt updatedAt");

    return res.status(200).json({
      success: true,
      message: "Chat sessions fetched successfully",
      data: {
        totalSessions: sessions.length,
        sessions,
      },
    });
  } catch (error) {
    console.error("Get Chat Sessions Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/v1/chat/sessions/:sessionId
 * Fetch one session and all messages
 */
const getChatSessionMessages = async (req, res) => {
  try {
    const user = req.user;
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: user._id,
      organizationId: user.organizationId,
    }).select("title lastMessageAt createdAt updatedAt");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    const messages = await ChatMessage.find({
      sessionId: session._id,
      userId: user._id,
      organizationId: user.organizationId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      message: "Chat session messages fetched successfully",
      data: {
        session,
        totalMessages: messages.length,
        messages,
      },
    });
  } catch (error) {
    console.error("Get Chat Session Messages Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE /api/v1/chat/sessions/:sessionId
 * Delete complete session and its all messages
 */
const deleteChatSession = async (req, res) => {
  try {
    const user = req.user;
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: user._id,
      organizationId: user.organizationId,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    const deletedMessages = await ChatMessage.deleteMany({
      sessionId: session._id,
      userId: user._id,
      organizationId: user.organizationId,
    });

    await ChatSession.deleteOne({
      _id: session._id,
      userId: user._id,
      organizationId: user.organizationId,
    });

    return res.status(200).json({
      success: true,
      message: "Chat session and all messages deleted successfully",
      data: {
        sessionId,
        deletedMessagesCount: deletedMessages.deletedCount,
      },
    });
  } catch (error) {
    console.error("Delete Chat Session Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Temporary test controller for fake organization data
 */
const askTestQuestion = async (req, res) => {
  try {
    const {
      question,
      topK,
      userRole = "employee",
      department = "general",
    } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const result = await askRagQuestion({
      question,
      organizationId: "test-org",
      userRole: String(userRole).toLowerCase(),
      department: String(department).toLowerCase(),
      topK: topK || 5,
      chatHistory: [],
    });

    return res.status(200).json({
      success: true,
      message: "Test answer generated successfully",
      data: {
        question,
        userRole,
        department,
        answer: result.answer,
        sources: result.sources,
        retrievedChunks: result.retrievedChunks,
      },
    });
  } catch (error) {
    console.error("Ask Test Question Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  askQuestion,
  getUserChatSessions,
  getChatSessionMessages,
  deleteChatSession,
  askTestQuestion,
};