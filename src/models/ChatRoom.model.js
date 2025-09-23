const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    name: { type: String, default: null }, // nhóm thì có tên, 1-1 thì có thể null
    type: { type: String, enum: ["private", "group"], required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    avatar: { type: String, default: null }, // nhóm thì có avatar, 1-1 thì có thể null

    // chỉ áp dụng cho group
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type === "group";
      },
    },
    onlyOwnerCanSend: {
      type: Boolean,
      default: false,
      required: function () {
        return this.type === "group";
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
