// controllers/FindUsersController.js
const User = require("../models/user");

// ---------------- Send connection request ----------------
exports.sendConnectionRequest = async (req, res, io) => {
  try {
    const { targetUserId } = req.params; // Using params
    const currentUserId = req.user._id;

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({ msg: "You cannot connect with yourself." });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    // Already connected?
    if (currentUser.connections.some((id) => id.equals(targetUserId))) {
      return res.status(400).json({ msg: "Already connected." });
    }

    // Request already sent?
    if (currentUser.sentRequests.some((id) => id.equals(targetUserId))) {
      return res.status(400).json({ msg: "Request already sent." });
    }

    // Request already received?
    if (currentUser.receivedRequests.some((id) => id.equals(targetUserId))) {
      return res
        .status(400)
        .json({ msg: "User has already sent you a request." });
    }

    // Update requests
    currentUser.sentRequests.push(targetUserId);
    targetUser.receivedRequests.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    // Emit WebSocket event to target user
    if (io && global.onlineUsers.has(targetUserId.toString())) {
      const sockets = global.onlineUsers.get(targetUserId.toString());
      sockets.forEach((socketId) => {
        io.to(socketId).emit("requestReceived", {
          fromUserId: currentUser._id.toString(),
          fromUserName: `${currentUser.firstname} ${currentUser.lastname}`,
          totalConnections: targetUser.connections.length,
          totalRequests: targetUser.receivedRequests.length,
        });
      });
    }

    res.json({ msg: "Request sent successfully." });
  } catch (err) {
    console.error("Error in sendConnectionRequest:", err);

    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// Accept connection request
exports.acceptConnectionRequest = async (req, res, io) => {
  try {
    const { requesterId } = req.params; // requesterId comes from URL params
    const currentUserId = req.user._id;

    // Fetch users from DB
    const currentUser = await User.findById(currentUserId);
    const requester = await User.findById(requesterId);

    if (!currentUser) {
      return res.status(404).json({ msg: "Current user not found." });
    }

    if (!requester) {
      return res.status(404).json({ msg: "Requester user not found." });
    }

    // Check if the request exists
    const requestExists = currentUser.receivedRequests.some((id) =>
      id.equals(requesterId)
    );

    if (!requestExists) {
      return res.status(400).json({ msg: "No request found from this user." });
    }

    // Remove requesterId from receivedRequests of current user
    currentUser.receivedRequests = currentUser.receivedRequests.filter(
      (id) => !id.equals(requesterId)
    );

    // Remove currentUserId from sentRequests of requester
    requester.sentRequests = requester.sentRequests.filter(
      (id) => !id.equals(currentUserId)
    );

    // Add to connections if not already connected
    if (!currentUser.connections.some((id) => id.equals(requesterId))) {
      currentUser.connections.push(requesterId);
    }
    if (!requester.connections.some((id) => id.equals(currentUserId))) {
      requester.connections.push(currentUserId);
    }

    // Save both users
    await currentUser.save();
    await requester.save();

    // Emit WebSocket event to requester to update 'Connected' status
    if (io && global.onlineUsers.has(requesterId.toString())) {
      const sockets = global.onlineUsers.get(requesterId.toString());
      sockets.forEach((socketId) => {
        io.to(socketId).emit("requestAccepted", {
          byUserId: currentUser._id.toString(),
          byUserName: `${currentUser.firstname} ${currentUser.lastname}`,
          totalConnections: requester.connections.length,
        });
      });
    }

    // Emit to current user to update connections dynamically
    if (io && global.onlineUsers.has(currentUserId.toString())) {
      const sockets = global.onlineUsers.get(currentUserId.toString());
      sockets.forEach((socketId) => {
        io.to(socketId).emit("requestAccepted", {
          byUserId: requester._id.toString(),
          byUserName: `${requester.firstname} ${requester.lastname}`,
          totalConnections: currentUser.connections.length,
        });
      });
    }

    res.json({ msg: "Connection accepted successfully." });
  } catch (err) {
    console.error("Error in acceptConnectionRequest:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// ---------------- Reject connection request ----------------
exports.rejectConnectionRequest = async (req, res, io) => {
  try {
    const { requesterId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);
    const requester = await User.findById(requesterId);

    if (!currentUser || !requester) {
      return res.status(404).json({ msg: "User not found." });
    }

    // Remove requests safely
    currentUser.receivedRequests = currentUser.receivedRequests.filter(
      (id) => !id.equals(requesterId)
    );
    requester.sentRequests = requester.sentRequests.filter(
      (id) => !id.equals(currentUserId)
    );

    await currentUser.save();
    await requester.save();

    // Emit WebSocket event to requester
    if (io && global.onlineUsers.has(requesterId.toString())) {
      const sockets = global.onlineUsers.get(requesterId.toString());
      sockets.forEach((socketId) => {
        io.to(socketId).emit("requestRejected", {
          byUserId: currentUser._id.toString(),
          byUserName: `${currentUser.firstname} ${currentUser.lastname}`,
        });
      });
    }

    res.json({ msg: "Connection request rejected." });
  } catch (err) {
    console.error("Error in rejectConnectionRequest:", err);

    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
// controllers/FindUsersController.js

// Fetch all users + current user info
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const users = await User.find({ _id: { $ne: currentUserId } });

    const currentUser = await User.findById(currentUserId);

    res.json({
      users: users.map((u) => ({
        _id: u._id.toString(),
        firstname: u.firstname,
        lastname: u.lastname,
        username: u.username,
        profilePic: u.profilePic,
        role: u.role,
        batch: u.batch,
        connections: u.connections.map(String),
        sentRequests: u.sentRequests.map(String),
        receivedRequests: u.receivedRequests.map(String),
      })),
      currentUser: {
        _id: currentUser._id.toString(),
        firstname: currentUser.firstname,
        lastname: currentUser.lastname,
        username: currentUser.username,
        profilePic: currentUser.profilePic,
        role: currentUser.role,
        batch: currentUser.batch,
        connections: currentUser.connections.map(String),
        sentRequests: currentUser.sentRequests.map(String),
        receivedRequests: currentUser.receivedRequests.map(String),
      },
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
