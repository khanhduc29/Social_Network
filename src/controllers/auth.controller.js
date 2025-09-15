const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const  transporter  = require('../config/mail');
const crypto = require('crypto');

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
      { id: user._id, email: user.email , role : user.role , avatar: user.avatar},
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // res.json({ message: 'Login successful', token });
     res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true nếu deploy https
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const me = async (req, res) => {
  try {
    const token = req.cookies.token; // lấy token từ cookie
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async( req, res ) => {
  try {
    const  {email}  = req.body;
    if(!email || email.trim() == "") return res.status(400).json({
      message : "Missing input"
    })
    const user = await User.findOne({email})
    if( !user )  return res.status(404).json({
      message : "Cant not find user"
      }
    )

    // create token reset password
    const resetToken = crypto.randomBytes(32).toString('hex');

    // save token and expiry time in DB (15 min)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000 //15 min
    try {
      const updateUser = await user.save();
      console.log("Update resetPasswordToken and resetPassWordExpires success", updateUser)
    } catch (error) {
      console.log(error)
    }

    // link reset password 
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`

    // send email
    const mailOptions = {
      form : `"Your App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Đặt lại mật khẩu',
      html: `
        <h3>Xin chào ${user.username},</h3>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link bên dưới để đặt lại mật khẩu:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>Link này sẽ hết hạn trong 15 phút.</p>
      ` 
    }

    try {
      const sendMail = await transporter.sendMail(mailOptions);
      console.log(sendMail.response)
    } catch (error) {
      console.log(error)
    }


      
      
    res.json({message : "Email đặt lại mật khẩu đã được gửi!"})
  } catch (error) {
    console.log(error)
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // check token
    const user = await User.findOne({
      resetPasswordExpires: { $gt: Date.now() },
      resetPasswordToken: token
    })

    if(!user) return res.status(400).json({
      message : "Invalid token or exprired token"
    })

    // Update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // delete token after reset success
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // save
    await user.save();

    res.json({
      message: "Updated password"
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message : "Something went wrong"
    })
  }
}

module.exports = { register, login ,   forgotPassword , resetPassword , logout , me};
