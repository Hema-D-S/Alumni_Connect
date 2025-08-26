const User = require("../models/user");

// GET all users (except current logged-in user)
exports.getAllUsers = async (req, res) => {
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
};
