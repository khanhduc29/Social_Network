const ChatRoomModel = require("../models/ChatRoom.model");
const Message = require("../models/Message.model");


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

    const message = new Message({
      room: roomId,
      sender,
      content,
      readBy: [sender],
    });

    await message.save();

    // 🟢 Populate sender trước khi trả về
    await message.populate("sender", "_id username");

    res.status(201).json(message);
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
      return res.status(403).json({ message: "You are not a member of this room" });
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
    const { type, partnerId, members = [], name = []} = req.body;
    const currentUserId = req.user.id; // lấy từ token

    console.log("currentUserId", currentUserId)

    // Private chat
    if (type === "private") {
      if (!partnerId) {
        return res.status(400).json({ message: "partnerId is required for private chat" });
      }

      // check nếu room đã tồn tại
      const existingRoom = await ChatRoomModel.findOne({
        type: "private",
        members: { $all: [currentUserId, partnerId], $size: 2 }
      });

      if (existingRoom) return res.status(200).json(existingRoom);

      const newRoom = new ChatRoomModel({
        type: "private",
        members: [currentUserId, partnerId],
        name: null
      });

      await newRoom.save();
      return res.status(201).json(newRoom);
    }

    // Group chat
    if (type === "group") {
      if (!members || members.length < 2) {
        return res.status(400).json({ message: "Group must have at least 2 members" });
      }

      const newGroup = new ChatRoomModel({
        type: "group",
        name: name || "New Group",
        members: [...members, currentUserId], // thêm luôn người tạo
        owner: currentUserId
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
    console.log("userId", userId)

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

module.exports = {getMessages, sendMessage, markAsRead, createRoom, getRooms}