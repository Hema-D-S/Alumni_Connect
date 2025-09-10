// controllers/connectionController.js
const User = require("../models/user");

// Get all connected users for the logged-in user
const getConnections = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Fetch current user
    const currentUser = await User.findById(currentUserId).populate(
      "connections",
      "_id firstname lastname email profilePic"
    );

    if (!currentUser) return res.status(404).json({ msg: "User not found" });

    // Return connected users array with connections wrapper
    res.json({ connections: currentUser.connections || [] });
  } catch (err) {
    console.error("Error fetching connections:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { getConnections };
