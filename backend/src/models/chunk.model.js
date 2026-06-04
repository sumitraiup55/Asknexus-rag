const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
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

    chunkIndex: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    wordCount: {
      type: Number,
      default: 0,
    },

    vectorId: {
      type: String,
      required: true,
      index: true,
    },

    originalFileName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      enum: ["pdf", "txt"],
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
      default: ["admin", "employee"],
    },
  },
  {
    timestamps: true,
  }
);

chunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });

const Chunk = mongoose.model("Chunk", chunkSchema);

module.exports = Chunk;