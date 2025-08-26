// routes/FindUsers.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const User = require("../models/user");

// GET /api/findusers
// Returns all users except the currently logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const users = await User.find({ _id: { $ne: currentUserId } }).select(
      "firstname lastname username role batch profilePic connections"
    );

    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
