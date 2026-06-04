const fs = require("fs/promises");
const path = require("path");

const Document = require("../models/document.model");
const Chunk = require("../models/chunk.model");

const { parseFile } = require("../services/fileParser.service");
const { createDocumentChunks } = require("../services/chunk.service");
const { generateEmbeddingsForChunks } = require("../services/embedding.service");
const {
  upsertEmbeddedChunks,
  deleteVectorsByDocumentId,
} = require("../services/vector.service");

/**
 * Safely delete local uploaded file
 */
const deleteLocalFile = async (filePath) => {
  try {
    if (!filePath) return;

    const absolutePath = path.resolve(filePath);

    await fs.access(absolutePath);
    await fs.unlink(absolutePath);

    console.log(`Local file deleted: ${absolutePath}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("Local file already deleted or not found");
      return;
    }

    throw new Error(`Local file delete failed: ${error.message}`);
  }
};

/**
 * Admin upload document and index into Qdrant
 */
const uploadDocument = async (req, res) => {
  let documentRecord = null;

  try {
    const file = req.file;
    const user = req.user;

    const {
      title,
      department = "general",
      accessRoles = ["admin", "employee"],
    } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required",
      });
    }

    if (!user.organizationId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked with any organization",
      });
    }

    const normalizedAccessRoles = Array.isArray(accessRoles)
      ? accessRoles
      : String(accessRoles)
          .split(",")
          .map((role) => role.trim())
          .filter(Boolean);

    // 1. Parse uploaded file
    const parsedData = await parseFile(file);

    // 2. Create document record
    documentRecord = await Document.create({
      title: title || parsedData.originalFileName,
      originalFileName: parsedData.originalFileName,
      storedFileName: parsedData.storedFileName,
      filePath: parsedData.filePath,
      fileType: parsedData.fileType,
      mimeType: parsedData.mimeType,
      fileSize: parsedData.fileSize,
      totalPages: parsedData.totalPages,
      organizationId: user.organizationId,
      uploadedBy: user._id,
      department,
      accessRoles: normalizedAccessRoles,
      status: "processing",
    });

    // 3. Create chunks
    const chunks = createDocumentChunks({
      text: parsedData.text,
      documentId: documentRecord._id,
      organizationId: user.organizationId,
      uploadedBy: user._id,
      originalFileName: parsedData.originalFileName,
      fileType: parsedData.fileType,
      accessRoles: normalizedAccessRoles,
      department,
      chunkSize: 500,
      chunkOverlap: 100,
    });

    // 4. Generate embeddings
    const embeddedChunks = await generateEmbeddingsForChunks(chunks);

    // 5. Store vectors in Qdrant
    const storedVectors = await upsertEmbeddedChunks(embeddedChunks);

    // 6. Store chunk metadata in MongoDB
    const mongoChunks = embeddedChunks.map((chunk, index) => ({
      documentId: documentRecord._id,
      organizationId: user.organizationId,
      uploadedBy: user._id,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      wordCount: chunk.wordCount,
      vectorId: storedVectors[index].vectorId,
      originalFileName: parsedData.originalFileName,
      fileType: parsedData.fileType,
      department,
      accessRoles: normalizedAccessRoles,
    }));

    await Chunk.insertMany(mongoChunks);

    // 7. Update document status
    documentRecord.status = "ready";
    documentRecord.totalChunks = chunks.length;
    documentRecord.processingError = null;
    await documentRecord.save();

    return res.status(201).json({
      success: true,
      message: "Document uploaded, chunked, embedded, and stored successfully",
      data: {
        document: documentRecord,
        totalChunks: chunks.length,
        totalVectors: storedVectors.length,
      },
    });
  } catch (error) {
    console.error("Upload Document Error:", error);

    if (documentRecord) {
      documentRecord.status = "failed";
      documentRecord.processingError = error.message;
      await documentRecord.save();
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin get all documents of organization
 */
const getAllDocuments = async (req, res) => {
  try {
    const user = req.user;

    const {
      status,
      fileType,
      department,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      organizationId: user.organizationId,
      status: { $ne: "deleted" },
    };

    if (status) query.status = status;
    if (fileType) query.fileType = fileType;
    if (department) query.department = department;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { originalFileName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const documents = await Document.find(query)
      .populate("uploadedBy", "fullName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalDocuments = await Document.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Documents fetched successfully",
      data: {
        documents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get Documents Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin get single document details
 */
const getDocumentById = async (req, res) => {
  try {
    const user = req.user;
    const { documentId } = req.params;

    const document = await Document.findOne({
      _id: documentId,
      organizationId: user.organizationId,
      status: { $ne: "deleted" },
    }).populate("uploadedBy", "fullName email role");

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const chunks = await Chunk.find({
      documentId: document._id,
    })
      .select("chunkIndex text wordCount vectorId createdAt")
      .sort({ chunkIndex: 1 });

    return res.status(200).json({
      success: true,
      message: "Document details fetched successfully",
      data: {
        document,
        chunks,
      },
    });
  } catch (error) {
    console.error("Get Document By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin delete document from all storage locations
 */
const deleteDocument = async (req, res) => {
  try {
    const user = req.user;
    const { documentId } = req.params;

    const document = await Document.findOne({
      _id: documentId,
      organizationId: user.organizationId,
      status: { $ne: "deleted" },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Mark deleting first, so this document does not get used during cleanup
    document.status = "deleting";
    await document.save();

    // 1. Delete vectors from Qdrant
    await deleteVectorsByDocumentId(document._id);

    // 2. Delete chunks from MongoDB
    await Chunk.deleteMany({
      documentId: document._id,
      organizationId: user.organizationId,
    });

    // 3. Delete local uploaded file
    await deleteLocalFile(document.filePath);

    // 4. Soft mark document deleted
    document.status = "deleted";
    document.deletedAt = new Date();
    document.deletedBy = user._id;
    document.totalChunks = 0;
    await document.save();

    return res.status(200).json({
      success: true,
      message:
        "Document deleted successfully from local storage, MongoDB chunks, and Qdrant vectors",
      data: {
        documentId: document._id,
        title: document.title,
        originalFileName: document.originalFileName,
      },
    });
  } catch (error) {
    console.error("Delete Document Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin hard delete document record also
 * Use carefully. This removes the document document from MongoDB too.
 */
const hardDeleteDocument = async (req, res) => {
  try {
    const user = req.user;
    const { documentId } = req.params;

    const document = await Document.findOne({
      _id: documentId,
      organizationId: user.organizationId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    await deleteVectorsByDocumentId(document._id);

    await Chunk.deleteMany({
      documentId: document._id,
      organizationId: user.organizationId,
    });

    await deleteLocalFile(document.filePath);

    await Document.deleteOne({
      _id: document._id,
      organizationId: user.organizationId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Document permanently deleted from MongoDB, local storage, chunks, and Qdrant",
      data: {
        documentId,
      },
    });
  } catch (error) {
    console.error("Hard Delete Document Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  hardDeleteDocument,
};