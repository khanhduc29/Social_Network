// src/server.js
const app = require('./app');
const { createServer } = require('http');
const { init } = require('./services/socket'); // import init từ services/socket.js

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

// 🔥 Khởi tạo socket
init(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
