const ChatRoomModel = require("../models/ChatRoom.model");
const Message = require("../models/Message.model");
const UserModel = require("../models/User.model");
const User = require("../models/User.model");

const { getIO } = require("../services/socket");

// get user
const getUser = async (req, res) => {
  try {
    const currentUserId = req.user.id; // lấy từ token
    const { username } = req.query;

    // build query
    const query = { _id: { $ne: currentUserId } };

    if (username) {
      query.username = { $regex: username, $options: "i" }; // tìm gần đúng
    }

    const users = await User.find(query)
      .select("_id username email avatar")
      .limit(10); // giới hạn 10 kết quả

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Server error" });
  }
};

// send message
const sendMessage = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { roomId, content } = req.body;
    const sender = req.user.id;

    const room = await ChatRoomModel.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Nếu phòng chỉ cho owner gửi
    if (room.onlyOwnerCanSend && room.owner.toString() !== sender) {
      return res.status(403).json({
        message: "Only room owner can send messages",
      });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        url: file.path, // Cloudinary URL
        type: file.mimetype.includes("image")
          ? "image"
          : file.mimetype.includes("video")
          ? "video"
          : file.mimetype.includes("audio")
          ? "audio"
          : "file",
      }));
    }

    const message = new Message({
      room: roomId,
      sender,
      content,
      attachments,
      readBy: [sender],
    });

    console.log("message", message);
    await message.save();

    // 🟢 Populate sender trước khi trả về
    // await message.populate("sender", "_id username");
    const populatedMessage = await message.populate([
      { path: "sender", select: "_id username avatar" },
      { path: "room", select: "_id" },
    ]);

    console.log("populatedMessage", populatedMessage);

    // 🔥 Emit đến tất cả socket trong room
    getIO().to(roomId).emit("newMessage", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// get messages
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id; // lấy từ token

    // Kiểm tra user có phải thành viên room không
    const room = await ChatRoomModel.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.members.includes(userId)) {
      return res
        .status(403)
        .json({ message: "You are not a member of this room" });
    }

    // Nếu user là thành viên thì lấy tin nhắn
    const messages = await Message.find({ room: roomId })
      .populate("sender", "username email avatar")
      .sort({ createdAt: 1 });

    res.status(200).json({ roomId, messages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// readed
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      await message.save();
    }

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// create room
const createRoom = async (req, res) => {
  try {
    const { type, partnerId, members = [], name  } = req.body;
    const currentUserId = req.user.id; // lấy từ token

    console.log("currentUserId", currentUserId);

    // Private chat
    if (type === "private") {
      if (!partnerId)
        return res.status(400).json({ message: "partnerId is required" });

      // check nếu room đã tồn tại
      let existingRoom = await ChatRoomModel.findOne({
        type: "private",
        members: { $all: [currentUserId, partnerId], $size: 2 },
      }).populate("members", "username avatar"); // lấy username + avatar member

      if (existingRoom) return res.status(200).json(existingRoom);

      // lấy info partner
      const partner = await UserModel.findById(partnerId);

      const newRoom = new ChatRoomModel({
        type: "private",
        members: [currentUserId, partnerId],
        name: typeof name === "string" && name.trim() !== "" ? name : null,
      });

      await newRoom.save();
      await newRoom.populate("members", "username avatar"); // để FE hiển thị ngay
      return res.status(201).json(newRoom);
    }

    // Group chat
    if (type === "group") {
      if (!members || members.length < 2) {
        return res
          .status(400)
          .json({ message: "Group must have at least 2 members" });
      }

      const newGroup = new ChatRoomModel({
        type: "group",
        name: name || "New Group",
        members: [...members, currentUserId], // thêm luôn người tạo
        owner: currentUserId,
      });

      await newGroup.save();
      return res.status(201).json(newGroup);
    }

    res.status(400).json({ message: "Invalid room type" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lấy danh sách room mà user đang tham gia
const getRooms = async (req, res) => {
  try {
    const userId = req.user.id; // lấy từ token
    console.log("userId", userId);

    // Tìm tất cả room có chứa userId
    const rooms = await ChatRoomModel.find({ members: userId })
      .populate("members", "username email avatar")
      .sort({ updatedAt: -1 });

    // Có thể populate thêm lastMessage nếu cần
    res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
  createRoom,
  getRooms,
  getUser,
};
