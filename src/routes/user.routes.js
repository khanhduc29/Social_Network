const express = require('express');
const { updateProfile } = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { upload } = require("../config/cloudinary");

const router = express.Router();

router.put('/me', authMiddleware, upload.single("avatar"), updateProfile);


module.exports = router;
