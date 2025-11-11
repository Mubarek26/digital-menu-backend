const multer = require("multer");
const AppError = require("../utils/appError");
const path = require("path");
const express = require("express");
const app= express();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/foods");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    // send error
    cb(new AppError("Invalid file type. Only images are allowed.", 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});
const uploadImage = upload.single("image");
module.exports = uploadImage;
