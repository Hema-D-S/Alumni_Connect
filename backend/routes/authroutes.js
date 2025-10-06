const express = require("express");
const {
  register,
  login,
  googleAuth,
  linkedinAuth,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authcontroller");

const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/authmiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ------------------ Multer Setup ------------------
// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ------------------ Routes ------------------

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/linkedin", linkedinAuth);

// Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Profile routes
router.get("/profile", authMiddleware, getProfile);
router.put(
  "/profile",
  authMiddleware,
  upload.single("profilePic"),
  updateProfile
);

// Admin route
router.get(
  "/admin/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ msg: "Welcome to Admin Dashboard" });
  }
);

// Alumni resources route
router.get(
  "/alumni/resources",
  authMiddleware,
  authorizeRoles("alumni"),
  (req, res) => {
    res.json({ msg: "Exclusive Alumni Resources" });
  }
);

module.exports = router;
