const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");

// Upload 1 file
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    url: req.file.path, // URL Cloudinary
    type: req.file.mimetype, // image/png, video/mp4, audio/mpeg...
  });
});

// Upload nhiều file
router.post("/uploads", upload.array("files", 5), (req, res) => {
  if (!req.files) return res.status(400).json({ error: "No files uploaded" });
  const urls = req.files.map((file) => ({
    url: file.path,
    type: file.mimetype,
  }));
  res.json({ files: urls });
});

module.exports = router;
