const express = require('express');
const { getMessages, sendMessage , markAsRead, createRoom, getRooms} = require('../controllers/message.controller');
const authMiddleware = require('../middlewares/auth.middleware')


const router = express.Router();

router.get("/rooms", authMiddleware, getRooms);
router.post("/",authMiddleware,  sendMessage);
router.get("/:roomId",authMiddleware,  getMessages);
router.patch("/:messageId/read",authMiddleware,  markAsRead);
router.post("/create-roomId",authMiddleware, createRoom)

module.exports = router;
