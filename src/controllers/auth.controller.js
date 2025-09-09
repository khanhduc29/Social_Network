const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const  transporter  = require('../config/mail');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // send email to user
    const mailOptions = {
      from: `"Your App Name" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `
        <h2>Chào mừng ${username}!</h2>
        <p>Tài khoản của bạn đã được tạo thành công.</p>
        <p><strong>Thông tin đăng nhập:</strong></p>
        <ul>
          <li>Email: ${email}</li>
          <li>Mật khẩu: ${password}</li>
        </ul>
        <p>Vui lòng bảo mật thông tin này và không chia sẻ với người khác.</p>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("send email successfully", info.response)
      
    } catch (error) {
      console.log("Error while sent email", error)
    }

    res.status(201).json({ message: 'User registered', user: newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login };
