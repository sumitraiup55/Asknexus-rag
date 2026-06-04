const { QdrantClient } = require("@qdrant/js-client-rest");
const { v4: uuidv4 } = require("uuid");

if (!process.env.QDRANT_URL) {
  console.warn("Warning: QDRANT_URL is missing in environment variables");
}

if (!process.env.QDRANT_API_KEY) {
  console.warn("Warning: QDRANT_API_KEY is missing in environment variables");
}

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME =
  process.env.QDRANT_COLLECTION_NAME || "asknexus_documents";

const VECTOR_SIZE = Number(process.env.QDRANT_VECTOR_SIZE) || 3072;

/**
 * Check collection exists
 */
const collectionExists = async () => {
  try {
    const collections = await qdrant.getCollections();

    return collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME
    );
  } catch (error) {
    throw new Error(`Failed to check Qdrant collection: ${error.message}`);
  }
};

/**
 * Create collection if it does not exist
 */
/**
 * Create collection if it does not exist
 */
const ensureCollection = async () => {
  try {
    const exists = await collectionExists();

    if (!exists) {
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });

      console.log(`Qdrant collection created: ${COLLECTION_NAME}`);
    } else {
      console.log(`Qdrant collection ready: ${COLLECTION_NAME}`);
    }

    // Important for Qdrant Cloud filtering
    await createPayloadIndexes();
  } catch (error) {
    throw new Error(`Failed to create Qdrant collection: ${error.message}`);
  }
};

/**
 * Convert embedded chunks into Qdrant points
 */
const buildQdrantPoints = (embeddedChunks = []) => {
  return embeddedChunks.map((chunk) => {
    const vectorId = uuidv4();

    return {
      id: vectorId,
      vector: chunk.embedding,
      payload: {
        vectorId,
        documentId: chunk.documentId,
        organizationId: chunk.organizationId,
        uploadedBy: chunk.uploadedBy,
        originalFileName: chunk.originalFileName,
        fileType: chunk.fileType,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        wordCount: chunk.wordCount,
        startWord: chunk.startWord,
        endWord: chunk.endWord,
        accessRoles: chunk.accessRoles,
        department: chunk.department,
        embeddingModel: chunk.embeddingModel,
        status: "ready",
        createdAt: new Date().toISOString(),
      },
    };
  });
};

/**
 * Store embedded chunks in Qdrant
 */
const upsertEmbeddedChunks = async (embeddedChunks = []) => {
  try {
    if (!Array.isArray(embeddedChunks) || embeddedChunks.length === 0) {
      throw new Error("Embedded chunks are required");
    }

    await ensureCollection();

    const points = buildQdrantPoints(embeddedChunks);

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    return points.map((point) => ({
      vectorId: point.id,
      documentId: point.payload.documentId,
      chunkIndex: point.payload.chunkIndex,
    }));
  } catch (error) {
    throw new Error(`Qdrant upsert failed: ${error.message}`);
  }
};

/**
 * Create payload indexes for filtered fields
 */
const createPayloadIndexes = async () => {
  try {
    const indexes = [
      {
        field_name: "organizationId",
        field_schema: "keyword",
      },
      {
        field_name: "accessRoles",
        field_schema: "keyword",
      },
      {
        field_name: "department",
        field_schema: "keyword",
      },
      {
        field_name: "documentId",
        field_schema: "keyword",
      },
      {
        field_name: "status",
        field_schema: "keyword",
      },
    ];

    for (const index of indexes) {
      try {
        await qdrant.createPayloadIndex(COLLECTION_NAME, {
          field_name: index.field_name,
          field_schema: index.field_schema,
          wait: true,
        });

        console.log(`Qdrant payload index created: ${index.field_name}`);
      } catch (error) {
        const errorMessage =
          error?.data?.status?.error ||
          error?.response?.data?.status?.error ||
          error.message;

        if (
          errorMessage.includes("already exists") ||
          errorMessage.includes("already has")
        ) {
          console.log(`Qdrant payload index already exists: ${index.field_name}`);
        } else {
          console.error(
            `Failed to create payload index for ${index.field_name}:`,
            errorMessage
          );
        }
      }
    }
  } catch (error) {
    throw new Error(`Payload index creation failed: ${error.message}`);
  }
};

/**
 * Search similar chunks from Qdrant
 */
const searchSimilarChunks = async ({
  queryEmbedding,
  organizationId,
  userRole,
  department,
  topK = 5,
}) => {
  try {
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error("Query embedding is required");
    }

    await ensureCollection();

    const filterMust = [];

    // Organization filter
    if (organizationId) {
      filterMust.push({
        key: "organizationId",
        match: {
          value: String(organizationId),
        },
      });
    }

    // Role filter
    // accessRoles is stored as array: ["admin", "employee"]
    // Qdrant match.value can match inside array payload also
    if (userRole) {
      filterMust.push({
        key: "accessRoles",
        match: {
          value: String(userRole),
        },
      });
    }

    filterMust.push({
      key: "status",
      match: {
        value: "ready",
      },
    });

    // For now, do not add department filter here
    // We will add department filter later after confirming data format

    const searchPayload = {
      vector: queryEmbedding,
      limit: Number(topK) || 5,
      with_payload: true,
      with_vector: false,
    };

    if (filterMust.length > 0) {
      searchPayload.filter = {
        must: filterMust,
      };
    }

    const searchResult = await qdrant.search(COLLECTION_NAME, searchPayload);

    return searchResult.map((item) => ({
      id: item.id,
      score: item.score,
      documentId: item.payload.documentId,
      originalFileName: item.payload.originalFileName,
      chunkIndex: item.payload.chunkIndex,
      text: item.payload.text,
      fileType: item.payload.fileType,
      department: item.payload.department,
      accessRoles: item.payload.accessRoles,
    }));
  } catch (error) {
    console.error("Qdrant Search Full Error:", error);
    console.error("Qdrant Search Response:", error?.data || error?.response?.data);

    throw new Error(
      `Qdrant search failed: ${
        error?.data?.status?.error ||
        error?.response?.data?.status?.error ||
        error.message
      }`
    );
  }
};

/**
 * Delete all vectors for a document
 */
const deleteVectorsByDocumentId = async (documentId) => {
  try {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    await ensureCollection();

    await qdrant.delete(COLLECTION_NAME, {
      wait: true,
      filter: {
        must: [
          {
            key: "documentId",
            match: {
              value: String(documentId),
            },
          },
        ],
      },
    });

    return true;
  } catch (error) {
    throw new Error(`Qdrant delete failed: ${error.message}`);
  }
};

module.exports = {
  qdrant,
  ensureCollection,
  createPayloadIndexes,
  upsertEmbeddedChunks,
  searchSimilarChunks,
  deleteVectorsByDocumentId,
};