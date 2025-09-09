// config/mail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // hoặc SMTP khác như Outlook, Mailgun...
  auth: {
    user: process.env.EMAIL_USER, // email gửi đi
    pass: process.env.EMAIL_PASS  // mật khẩu ứng dụng (app password)
  }
});

module.exports = transporter;
