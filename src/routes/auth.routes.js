const express = require('express');
const { register, login, forgotPassword, resetPassword, logout, me } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/logout', logout);
router.get('/me', me);

module.exports = router;
