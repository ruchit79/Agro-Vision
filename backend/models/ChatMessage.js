import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatThread",
    required: true
  },
  sender: {
    type: String,
    enum: ["user", "bot"],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model("ChatMessage", chatMessageSchema);

