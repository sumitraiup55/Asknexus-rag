const { GoogleGenAI } = require("@google/genai");
const { generateEmbedding } = require("./embedding.service");
const { searchSimilarChunks } = require("./vector.service");

if (!process.env.GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is missing in environment variables");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const LLM_MODEL = process.env.GEMINI_LLM_MODEL || "gemini-2.5-flash";

/**
 * Format retrieved chunks into context for LLM
 */
const buildContextFromChunks = (chunks = []) => {
  return chunks
    .map((chunk, index) => {
      return `
[Source ${index + 1}]
Document: ${chunk.originalFileName}
Chunk Index: ${chunk.chunkIndex}
Score: ${chunk.score}
Content:
${chunk.text}
`;
    })
    .join("\n\n");
};

/**
 * Remove duplicate sources from retrieved chunks
 */
const buildSources = (chunks = []) => {
  const sourceMap = new Map();

  chunks.forEach((chunk, index) => {
    const key = `${chunk.documentId}-${chunk.chunkIndex}`;

    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        sourceNumber: index + 1,
        documentId: chunk.documentId,
        documentName: chunk.originalFileName,
        fileType: chunk.fileType,
        chunkIndex: chunk.chunkIndex,
        score: chunk.score,
        preview: chunk.text.slice(0, 300),
      });
    }
  });

  return Array.from(sourceMap.values());
};


/**
 * Format previous chat messages for LLM context
 */
const buildChatHistoryContext = (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "No previous conversation history.";
  }

  return messages
    .map((message) => {
      if (message.role === "user") {
        return `User: ${message.question}`;
      }

      if (message.role === "assistant") {
        return `Assistant: ${message.answer}`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");
};

/**
 * Build strict RAG prompt with previous chat history
 */
const buildRagPrompt = ({ question, context, chatHistory = [] }) => {
  const historyContext = buildChatHistoryContext(chatHistory);

  return `
You are AskNexus, a company knowledge assistant.

Your job:
Answer the user's latest question using ONLY the provided company document context.

Rules:
1. Use only the provided company document context for factual answers.
2. You may use previous conversation history only to understand follow-up questions.
3. Do not use outside knowledge.
4. If the answer is not available in the company document context, say:
   "I could not find this information in the uploaded company documents."
5. Keep the answer clear and simple.
6. If useful, mention the source document name.
7. Do not create fake policies, fake numbers, fake dates, or fake sources.
8. If the context is unclear, say that the document context is unclear.

Previous Conversation History:
${historyContext}

Company Document Context:
${context}

Latest User Question:
${question}

Final Answer:
`;
};

/**
 * Extract final text from Gemini response safely
 */
const extractGeminiText = (response) => {
  if (response && typeof response.text === "string") {
    return response.text;
  }

  if (response && typeof response.text === "function") {
    return response.text();
  }

  const candidateText =
    response?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n") || "";

  if (candidateText) {
    return candidateText;
  }

  return "";
};

/**
 * Generate final answer from Gemini
 */
const generateAnswerWithGemini = async ({ question, chunks, chatHistory = [] }) => {
  try {
    const context = buildContextFromChunks(chunks);

    const prompt = buildRagPrompt({
      question,
      context,
      chatHistory,
    });

    const response = await ai.models.generateContent({
      model: LLM_MODEL,
      contents: prompt,
    });

    const answer = extractGeminiText(response).trim();

    if (!answer) {
      throw new Error("Empty answer received from Gemini");
    }

    return answer;
  } catch (error) {
    throw new Error(`Gemini answer generation failed: ${error.message}`);
  }
};

/**
 * Main RAG function
 */
const askRagQuestion = async ({
  question,
  organizationId,
  userRole,
  department,
  topK = 5,
  chatHistory = [],
}) => {
  try {
    if (!question || typeof question !== "string") {
      throw new Error("Question is required");
    }

    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    const cleanedQuestion = question.replace(/\s+/g, " ").trim();

    if (!cleanedQuestion) {
      throw new Error("Question cannot be empty");
    }

    // 1. Generate embedding for user question
    const queryEmbedding = await generateEmbedding(cleanedQuestion);

    // 2. Search relevant chunks from Qdrant
    const relevantChunks = await searchSimilarChunks({
      queryEmbedding,
      organizationId,
      userRole,
      department,
      topK,
    });

    // 3. If no chunks found
    if (!relevantChunks || relevantChunks.length === 0) {
      return {
        answer:
          "I could not find this information in the uploaded company documents.",
        sources: [],
        retrievedChunks: [],
      };
    }

    // 4. Generate answer using Gemini
    const answer = await generateAnswerWithGemini({
      question: cleanedQuestion,
      chunks: relevantChunks,
      chatHistory,
    });

    // 5. Build source list
    const sources = buildSources(relevantChunks);

    return {
      answer,
      sources,
      retrievedChunks: relevantChunks.map((chunk) => ({
        documentId: chunk.documentId,
        documentName: chunk.originalFileName,
        chunkIndex: chunk.chunkIndex,
        score: chunk.score,
      })),
    };
  } catch (error) {
    throw new Error(`RAG question failed: ${error.message}`);
  }
};

module.exports = {
  askRagQuestion,
  buildContextFromChunks,
  buildSources,
};

