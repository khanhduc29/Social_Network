const { Server } = require('socket.io');
const User = require('../models/User.model');
const MessageModel = require('../models/Message.model');
const fs = require("fs");
const path = require("path");

let io;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join phòng cá nhân (theo userId) -> để check online
    socket.on('join', async (userId) => {
      socket.join(userId);
      await User.findByIdAndUpdate(userId, { online: true });
      console.log(`✅ User ${userId} joined personal room`);
    });

    // Join phòng chat (theo roomId)
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`👥 Socket ${socket.id} joined chat room ${roomId}`);
    console.log("📌 Rooms của socket:", socket.rooms); // log tất cả room mà socket đang join
    });

    // Rời phòng chat
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      console.log(`👋 Socket ${socket.id} left chat room ${roomId}`);
    });

    // Gửi tin nhắn
    socket.on('sendMessage', async ({ sender, roomId, content, attachments = [] }) => {
      try {
         console.log(`📤 Nhận yêu cầu gửi tin nhắn: sender=${sender}, roomId=${roomId}, content=${content}, attachments=${attachments.length} files`);
        // Lưu DB
        const message = await MessageModel.create({
          sender,
          room: roomId,   // field đúng trong schema
          content,
          attachments,
        });

        console.log("💾 Tin nhắn đã lưu DB:", message);

        // Populate trước khi emit
        const populatedMsg = await message.populate([
          { path: "sender", select: "_id username avatar" },
          { path: "room", select: "_id" },
          { path: "attachments" }
        ]);
         console.log("📡 Emit newMessage tới room:", roomId, "dữ liệu:", populatedMsg);
        // Emit đến tất cả socket trong room
        io.to(roomId).emit('newMessage', populatedMsg);
      } catch (err) {
        console.error("❌ Lỗi sendMessage:", err);
      }
    });


    // Khi user disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
      // TODO: update User online=false nếu mapping được userId
    });
  });
}

function getIO() {
  if (!io) throw new Error("❌ Socket.io chưa được init!");
  return io;
}

module.exports = { init, getIO };
