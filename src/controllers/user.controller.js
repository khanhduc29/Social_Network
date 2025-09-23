const User = require("../models/User.model");

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { username, email } = req.body;
    console.log("req ", username, email, req.file);
    let avatar;
    if (req.file && req.file.path) {
      avatar = req.file.path; // URL from Cloudinary
    }
  
    const updatedData = { username, email, avatar };
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error while edit user", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateProfile,
};