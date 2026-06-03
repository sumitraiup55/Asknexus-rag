const DEFAULT_CHUNK_SIZE = 900; // words
const DEFAULT_CHUNK_OVERLAP = 150; // words

/**
 * Clean text before chunking
 */
const cleanText = (text = "") => {
  return text
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Split text into words
 */
const splitIntoWords = (text) => {
  return cleanText(text).split(" ").filter(Boolean);
};

/**
 * Create chunks using word-based chunking with overlap
 */
const createTextChunks = (text, options = {}) => {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP;

  if (!text || typeof text !== "string") {
    throw new Error("Text is required for chunking");
  }

  if (chunkOverlap >= chunkSize) {
    throw new Error("Chunk overlap must be smaller than chunk size");
  }

  const words = splitIntoWords(text);

  if (words.length === 0) {
    throw new Error("No readable words found for chunking");
  }

  const chunks = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunkWords = words.slice(start, end);
    const chunkText = chunkWords.join(" ").trim();

    if (chunkText) {
      chunks.push({
        chunkIndex,
        text: chunkText,
        wordCount: chunkWords.length,
        startWord: start,
        endWord: end - 1,
      });

      chunkIndex++;
    }

    if (end === words.length) {
      break;
    }

    start = end - chunkOverlap;
  }

  return chunks;
};

/**
 * Build chunks with document metadata
 */
const createDocumentChunks = ({
  text,
  documentId,
  organizationId,
  uploadedBy,
  originalFileName,
  fileType,
  accessRoles = ["admin", "employee"],
  department = "general",
  chunkSize,
  chunkOverlap,
}) => {
  const chunks = createTextChunks(text, {
    chunkSize,
    chunkOverlap,
  });

  return chunks.map((chunk) => ({
    ...chunk,
    documentId: String(documentId),
    organizationId: String(organizationId),
    uploadedBy: String(uploadedBy),
    originalFileName,
    fileType,
    accessRoles,
    department,
  }));
};

module.exports = {
  cleanText,
  createTextChunks,
  createDocumentChunks,
};