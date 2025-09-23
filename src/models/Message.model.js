const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  // attachments: [String],
  attachments: [
  {
    url: String,
    type: { type: String, enum: ["image", "video", "audio", "file"] }
  }
],

  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
