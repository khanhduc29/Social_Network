const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();


console.log("object", process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "chat_uploads"; // thư mục trong Cloudinary
    let resource_type = "auto"; // để Cloudinary tự nhận diện image/video/audio
    return {
      folder,
      resource_type,
      public_id: Date.now() + "-" + file.originalname,
    };
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
