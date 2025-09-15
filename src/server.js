const app = require('./app');
const { createServer } = require('http');
const { Server } = require('socket.io');
const MessageModel = require('./models/Message.model');

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // origin: '*',
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
    credentials: true, // 🔑 cho phép cookie đi kèm
  },
});

// Socket logic
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // Khi user đăng nhập -> join vào phòng riêng theo userId
  socket.on('join', async (userId) => {
    socket.join(userId);
    await User.findByIdAndUpdate(userId, { online: true });
    console.log(`✅ User ${userId} joined room`);
  });

  // Gửi tin nhắn
  socket.on('sendMessage', async ({ sender, receiver, content }) => {
    try {
      const message = await MessageModel.create({ sender, receiver, content });

      // gửi tin nhắn cho người nhận (nếu đang online)
      io.to(receiver).emit('receiveMessage', message);

      // trả lại cho sender (xác nhận lưu thành công)
      io.to(sender).emit('messageSent', message);
    } catch (err) {
      console.error(err);
    }
  });

  // Khi user disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    // ở đây có thể update User online=false nếu mapping được userId
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
