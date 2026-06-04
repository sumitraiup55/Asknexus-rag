const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema(
  {
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

    title: {
      type: String,
      required: [true, "Chat session title is required"],
      trim: true,
      maxlength: [120, "Chat session title cannot exceed 120 characters"],
      default: "New Chat",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Useful index for fetching latest chats of a user
chatSessionSchema.index({
  userId: 1,
  organizationId: 1,
  lastMessageAt: -1,
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

module.exports = ChatSession;