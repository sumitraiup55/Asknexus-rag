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
 * Build strict RAG prompt
 */
const buildRagPrompt = ({ question, context }) => {
  return `
You are AskNexus, a company knowledge assistant.

Your job:
Answer the user's question using ONLY the provided company document context.

Rules:
1. Use only the provided context.
2. Do not use outside knowledge.
3. If the answer is not available in the context, say:
   "I could not find this information in the uploaded company documents."
4. Keep the answer clear and simple.
5. If useful, mention the source document name.
6. Do not create fake policies, fake numbers, fake dates, or fake sources.
7. If the context is unclear, say that the document context is unclear.

Company Document Context:
${context}

User Question:
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
const generateAnswerWithGemini = async ({ question, chunks }) => {
  try {
    const context = buildContextFromChunks(chunks);

    const prompt = buildRagPrompt({
      question,
      context,
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