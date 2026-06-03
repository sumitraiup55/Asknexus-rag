const { GoogleGenAI } = require("@google/genai");

if (!process.env.GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is missing in environment variables");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

/**
 * Extract embedding array from Gemini response safely
 */
const extractEmbeddingValues = (response) => {
  // Common response shape:
  // response.embeddings[0].values
  if (
    response &&
    Array.isArray(response.embeddings) &&
    response.embeddings[0] &&
    Array.isArray(response.embeddings[0].values)
  ) {
    return response.embeddings[0].values;
  }

  // Fallback shape:
  // response.embedding.values
  if (
    response &&
    response.embedding &&
    Array.isArray(response.embedding.values)
  ) {
    return response.embedding.values;
  }

  throw new Error("Invalid embedding response from Gemini");
};

/**
 * Generate embedding for single text
 */
const generateEmbedding = async (text) => {
  try {
    if (!text || typeof text !== "string") {
      throw new Error("Text is required for embedding");
    }

    const cleanedText = text.replace(/\s+/g, " ").trim();

    if (!cleanedText) {
      throw new Error("Text is empty after cleaning");
    }

    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: cleanedText,
    });

    const embedding = extractEmbeddingValues(response);

    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error("Empty embedding received from Gemini");
    }

    return embedding;
  } catch (error) {
    throw new Error(`Gemini embedding failed: ${error.message}`);
  }
};

/**
 * Generate embeddings for multiple chunks
 * Note: This simple version processes one by one to avoid free-tier rate-limit issues.
 */
const generateEmbeddingsForChunks = async (chunks = []) => {
  try {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("Chunks array is required");
    }

    const embeddedChunks = [];

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);

      embeddedChunks.push({
        ...chunk,
        embedding,
        embeddingModel: EMBEDDING_MODEL,
      });
    }

    return embeddedChunks;
  } catch (error) {
    throw new Error(`Chunk embedding generation failed: ${error.message}`);
  }
};

module.exports = {
  generateEmbedding,
  generateEmbeddingsForChunks,
};