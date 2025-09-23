const express = require('express');
const authRoutes = require('./auth.routes');
const messageRoutes = require('./message.routes');
const uploadRoutes = require('./upload');
const userRoutes = require('../routes/user.routes');
const chatRoomRoutes = require('../routes/chatRoom.routes');


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/messages', messageRoutes);
router.use('/upload', uploadRoutes);
router.use('/updateProfile', userRoutes)
router.use('/rooms', chatRoomRoutes)


module.exports = router;
