const express = require('express');
const { getMessages, sendMessage , markAsRead, createRoom, getRooms, getUser} = require('../controllers/message.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload } = require('../config/cloudinary');


const router = express.Router();

router.get("/users/search", authMiddleware, getUser);
router.get("/rooms", authMiddleware, getRooms);
router.post("/",authMiddleware,upload.array("files", 5) , sendMessage);
router.get("/room/:roomId",authMiddleware,  getMessages);
router.patch("/:messageId/read",authMiddleware,  markAsRead);
router.post("/create-roomId",authMiddleware, createRoom)

module.exports = router;
