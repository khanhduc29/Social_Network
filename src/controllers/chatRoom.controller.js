

const ChatRoom = require("../models/ChatRoom.model");

// Cập nhật phòng
const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, owner } = req.body;
    const currentUserId = req.user.id; // lấy từ token

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    // Chỉ chủ phòng hoặc admin mới có quyền cập nhật
    if (room.owner.toString() !== currentUserId) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật phòng này" });
    }

    // Nếu có file ảnh upload lên
    let avatarUrl = room.avatar;
    if (req.file) {
      avatarUrl = req.file.path; // Cloudinary trả về link public
    }

    room.name = name || room.name;
    room.avatar = avatarUrl;
    if (owner) {
      room.owner = owner; // chuyển quyền chủ phòng cho người khác
    }

    await room.save();

    return res.json({
      message: "Cập nhật phòng thành công",
      room,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Xóa phòng
const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    // Chỉ chủ phòng mới được xóa
    if (room.owner.toString() !== currentUserId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa phòng này" });
    }

    await ChatRoom.findByIdAndDelete(roomId);

    return res.json({ message: "Xóa phòng thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  updateRoom,
  deleteRoom,
};
