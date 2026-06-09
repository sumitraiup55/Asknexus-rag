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

const FALLBACK_MODELS = (
  process.env.GEMINI_LLM_FALLBACK_MODELS || "gemini-2.5-flash-lite"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const GEMINI_RETRY_ATTEMPTS = Number(process.env.GEMINI_RETRY_ATTEMPTS || 3);
const GEMINI_RETRY_DELAY_MS = Number(process.env.GEMINI_RETRY_DELAY_MS || 1500);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getSafeErrorMessage = (error) => {
  if (!error) return "Unknown error";

  if (typeof error === "string") return error;

  if (error.message) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const isRetryableGeminiError = (error) => {
  const message = getSafeErrorMessage(error).toLowerCase();

  return (
    message.includes("500") ||
    message.includes("internal") ||
    message.includes("unexpected error") ||
    message.includes("please retry") ||
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("temporarily")
  );
};

const getCleanGeminiErrorMessage = (error) => {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (
    message.includes("500") ||
    message.includes("internal") ||
    message.includes("unexpected error")
  ) {
    return "Gemini model had a temporary internal error. AskNexus will retry or use a fallback model.";
  }

  if (isRetryableGeminiError(error)) {
    return "Gemini model is temporarily busy. AskNexus will retry or use a fallback model.";
  }

  return getSafeErrorMessage(error);
};

const getUniqueModels = () => {
  const models = [LLM_MODEL, ...FALLBACK_MODELS];
  return [...new Set(models.filter(Boolean))];
};

/**
 * Format retrieved chunks into context for LLM
 */
const buildContextFromChunks = (chunks = []) => {
  return chunks
    .map((chunk, index) => {
      return `
[Source ${index + 1}]
Document: ${chunk.originalFileName || chunk.documentName || chunk.title}
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
      const fileName =
        chunk.originalFileName ||
        chunk.documentName ||
        chunk.title ||
        "Document Source";

      sourceMap.set(key, {
        sourceNumber: index + 1,
        documentId: chunk.documentId,
        title: fileName,
        documentName: fileName,
        fileType: chunk.fileType,
        chunkIndex: chunk.chunkIndex,
        score: chunk.score,
        preview: chunk.text ? chunk.text.slice(0, 300) : "",
      });
    }
  });

  return Array.from(sourceMap.values());
};

/**
 * Build clean source names only
 */
const buildSourceNames = (chunks = []) => {
  const names = chunks
    .map(
      (chunk) =>
        chunk.originalFileName ||
        chunk.documentName ||
        chunk.title ||
        "Document Source"
    )
    .filter(Boolean);

  return [...new Set(names)];
};

/**
 * Source-only fallback when Gemini is busy
 */
const buildGeminiBusyFallbackAnswer = (chunks = []) => {
  const sourceNames = buildSourceNames(chunks);

  if (sourceNames.length === 0) {
    return (
      "AskNexus AI is temporarily busy due to high model demand. " +
      "Please try again after a few seconds."
    );
  }

  return (
    "AskNexus AI is temporarily busy due to high model demand, so I could not generate a full answer right now.\n\n" +
    "However, I found related information in these uploaded documents:\n\n" +
    sourceNames.map((name) => `- ${name}`).join("\n") +
    "\n\nPlease try again after a few seconds."
  );
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
You are AskNexus, a professional company knowledge assistant.

Your job:
Answer the user's latest question using ONLY the provided company document context.

Response style:
- Be clear, polished, and helpful.
- Use short paragraphs.
- Use bullet points when listing skills, rules, policies, or steps.
- Do not show raw chunk text.
- Do not show internal metadata.
- If useful, mention the source document name naturally.

Rules:
1. Use only the provided company document context for factual answers.
2. You may use previous conversation history only to understand follow-up questions.
3. Do not use outside knowledge.
4. If the answer is not available in the company document context, say:
   "I could not find this information in the uploaded company documents."
5. Do not create fake policies, fake numbers, fake dates, or fake sources.
6. If the context is unclear, say that the document context is unclear.

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
 * Call Gemini with retry for one model
 */
const callGeminiWithRetry = async ({ model, prompt }) => {
  let lastError;

  for (let attempt = 1; attempt <= GEMINI_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const answer = extractGeminiText(response).trim();

      if (!answer) {
        throw new Error("Empty answer received from Gemini");
      }

      return answer;
    } catch (error) {
      lastError = error;

      const retryable = isRetryableGeminiError(error);
      const isLastAttempt = attempt === GEMINI_RETRY_ATTEMPTS;

      if (!retryable || isLastAttempt) {
        throw error;
      }

      const delay = GEMINI_RETRY_DELAY_MS * attempt;

      console.log(
        `Gemini model "${model}" busy. Retry ${attempt}/${GEMINI_RETRY_ATTEMPTS} after ${delay}ms`
      );

      await sleep(delay);
    }
  }

  throw lastError;
};

/**
 * Generate final answer from Gemini with model fallback
 */
const generateAnswerWithGemini = async ({ question, chunks, chatHistory = [] }) => {
  const context = buildContextFromChunks(chunks);

  const prompt = buildRagPrompt({
    question,
    context,
    chatHistory,
  });

  const models = getUniqueModels();

  let lastError;

  for (const model of models) {
    try {
      console.log(`Generating RAG answer using Gemini model: ${model}`);

      const answer = await callGeminiWithRetry({
        model,
        prompt,
      });

      return answer;
    } catch (error) {
      lastError = error;

      console.log(
        `Gemini model "${model}" failed: ${getCleanGeminiErrorMessage(error)}`
      );

      if (!isRetryableGeminiError(error)) {
        throw new Error(getCleanGeminiErrorMessage(error));
      }
    }
  }

  console.log(
    `All Gemini models failed. Returning safe fallback answer. Last error: ${getCleanGeminiErrorMessage(
      lastError
    )}`
  );

  return buildGeminiBusyFallbackAnswer(chunks);
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

    // 4. Generate answer using Gemini with retry + fallback
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
        documentName:
          chunk.originalFileName ||
          chunk.documentName ||
          chunk.title ||
          "Document Source",
        chunkIndex: chunk.chunkIndex,
        score: chunk.score,
      })),
    };
  } catch (error) {
    throw new Error(`RAG question failed: ${getCleanGeminiErrorMessage(error)}`);
  }
};

module.exports = {
  askRagQuestion,
  buildContextFromChunks,
  buildSources,
};