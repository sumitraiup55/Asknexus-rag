const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    pageNumber: {
      type: Number,
      default: null,
    },

    chunkIndex: {
      type: Number,
      default: null,
    },

    score: {
      type: Number,
      default: null,
    },

    preview: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const retrievedChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },

    documentName: {
      type: String,
      default: "",
      trim: true,
    },

    chunkIndex: {
      type: Number,
      default: null,
    },

    score: {
      type: Number,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const chatMessageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: [true, "Chat session ID is required"],
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "assistant"],
      required: [true, "Message role is required"],
    },

    question: {
      type: String,
      trim: true,
      default: "",
    },

    answer: {
      type: String,
      trim: true,
      default: "",
    },

    sources: {
      type: [sourceSchema],
      default: [],
    },

    retrievedChunks: {
      type: [retrievedChunkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Useful index for loading messages of one chat in correct order
chatMessageSchema.index({
  sessionId: 1,
  createdAt: 1,
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;