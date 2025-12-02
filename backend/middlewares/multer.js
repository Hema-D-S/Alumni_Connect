const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // store inside /uploads
  },
  filename: function (req, file, cb) {
    // Generate timestamp-based filename like: 1761060074683-originalname.jpg
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '-'); // Replace spaces with hyphens
    cb(null, `${timestamp}-${originalName}`);
  },
});

// Allow images + PDF
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb("Error: Only images (jpeg, jpg, png) and PDF files are allowed!");
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
