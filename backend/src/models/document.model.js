const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },

    originalFileName: {
      type: String,
      required: true,
    },

    storedFileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      enum: ["pdf", "txt"],
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    originalFile: {
      storageType: {
        type: String,
        enum: ["gridfs", "local", "none"],
        default: "none",
      },

      gridFsFileId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true,
      },

      gridFsBucketName: {
        type: String,
        default: null,
      },

      gridFsFileName: {
        type: String,
        default: null,
      },

      gridFsContentType: {
        type: String,
        default: null,
      },

      gridFsLength: {
        type: Number,
        default: 0,
      },

      gridFsUploadDate: {
        type: Date,
        default: null,
      },
    },

    totalPages: {
      type: Number,
      default: 1,
    },

    totalChunks: {
      type: Number,
      default: 0,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    department: {
      type: String,
      default: "general",
      lowercase: true,
      trim: true,
    },

    accessRoles: {
      type: [String],
      enum: ["super_admin", "admin", "employee", "customer"],
      default: ["admin", "employee"],
    },

    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed", "deleting", "deleted"],
      default: "uploaded",
    },

    processingError: {
      type: String,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;