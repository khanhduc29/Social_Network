const express = require('express');
const { updateRoom, deleteRoom } = require('../controllers/chatRoom.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload } = require("../config/cloudinary");

const router = express.Router();

// Cập nhật phòng (PUT /api/rooms/:roomId)
router.put('/:roomId', authMiddleware, upload.single("avatar"), updateRoom);

// Xóa phòng (DELETE /api/rooms/:roomId)
router.delete('/:roomId', authMiddleware, deleteRoom);

module.exports = router;
