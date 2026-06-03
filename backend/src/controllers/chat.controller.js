const { askRagQuestion } = require("../services/rag.service");

/**
 * Ask question to company knowledge base
 */
const askQuestion = async (req, res) => {
  try {
    const { question, topK } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    if (!user.organizationId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked with any organization",
      });
    }

    const result = await askRagQuestion({
      question,
      organizationId: user.organizationId,
      userRole: user.role,
      department: user.department || "general",
      topK: topK || 5,
    });

    return res.status(200).json({
      success: true,
      message: "Answer generated successfully",
      data: {
        question,
        answer: result.answer,
        sources: result.sources,
        retrievedChunks: result.retrievedChunks,
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
 * Temporary test controller for fake organization data
 * Use only if you indexed test data with organizationId = "test-org"
 */
const askTestQuestion = async (req, res) => {
  try {
    const { question, topK } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const result = await askRagQuestion({
      question,
      organizationId: "test-org",
      userRole: "employee",
      department: "general",
      topK: topK || 5,
    });

    return res.status(200).json({
      success: true,
      message: "Test answer generated successfully",
      data: {
        question,
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
  askTestQuestion,
};