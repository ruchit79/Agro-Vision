import mongoose from "mongoose";

const chatThreadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true,
    default: "New Conversation"
  },
  lastMessage: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model("ChatThread", chatThreadSchema);
