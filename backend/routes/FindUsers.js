const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const User = require("../models/user");
const { getAllUsers } = require("../controllers/FindUsersController");

// ---------------- Get All Users ----------------
router.get("/", authMiddleware, getAllUsers);

// ---------------- Send Connection Request ----------------
router.post("/send/:targetUserId", authMiddleware, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;
    const io = req.app.get("io");

    if (targetUserId === String(currentUserId)) {
      return res.status(400).json({ msg: "You cannot connect with yourself" });
    }

    const sender = await User.findById(currentUserId);
    const receiver = await User.findById(targetUserId);

    if (!sender || !receiver) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Avoid duplicates
    if (sender.sentRequests.includes(targetUserId)) {
      return res.status(400).json({ msg: "Request already sent" });
    }

    // Update both users
    sender.sentRequests.push(targetUserId);
    receiver.receivedRequests.push(currentUserId);

    await sender.save();
    await receiver.save();

    // Emit WebSocket event to receiver if online
    if (global.onlineUsers.has(targetUserId)) {
      global.onlineUsers.get(targetUserId).forEach((socketId) => {
        io.to(socketId).emit("requestReceived", {
          fromUserId: currentUserId.toString(),
          fromUserName: `${sender.firstname} ${sender.lastname}`,
        });
      });
    }

    // Return updated user state
    const updatedSender = await User.findById(currentUserId)
      .select("sentRequests receivedRequests connections")
      .populate("sentRequests", "firstname lastname username profilePic")
      .populate("receivedRequests", "firstname lastname username profilePic")
      .populate("connections", "firstname lastname username profilePic");

    res.json({ msg: "Request sent successfully", currentUser: updatedSender });
  } catch (err) {
    console.error("Error sending request:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- Accept Connection Request ----------------
router.post("/accept/:requesterId", authMiddleware, async (req, res) => {
  try {
    const { requesterId } = req.params;
    const currentUserId = req.user._id;
    const io = req.app.get("io");

    const requester = await User.findById(requesterId);
    const receiver = await User.findById(currentUserId);

    if (!requester || !receiver) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Remove from pending
    receiver.receivedRequests = receiver.receivedRequests.filter(
      (id) => String(id) !== String(requesterId)
    );
    requester.sentRequests = requester.sentRequests.filter(
      (id) => String(id) !== String(currentUserId)
    );

    // Add to connections
    receiver.connections.push(requesterId);
    requester.connections.push(currentUserId);

    await receiver.save();
    await requester.save();

    // Emit WebSocket event to requester if online
    if (global.onlineUsers.has(requesterId)) {
      global.onlineUsers.get(requesterId).forEach((socketId) => {
        io.to(socketId).emit("requestAccepted", {
          byUserId: currentUserId.toString(),
          byUserName: `${receiver.firstname} ${receiver.lastname}`,
        });
      });
    }

    // Emit to current user to update connections dynamically
    if (global.onlineUsers.has(currentUserId)) {
      global.onlineUsers.get(currentUserId).forEach((socketId) => {
        io.to(socketId).emit("requestAccepted", {
          byUserId: requesterId.toString(),
          byUserName: `${requester.firstname} ${requester.lastname}`,
        });
      });
    }

    // Return updated user state
    const updatedReceiver = await User.findById(currentUserId)
      .select("sentRequests receivedRequests connections")
      .populate("sentRequests", "firstname lastname username profilePic")
      .populate("receivedRequests", "firstname lastname username profilePic")
      .populate("connections", "firstname lastname username profilePic");

    res.json({ msg: "Connection accepted", currentUser: updatedReceiver });
  } catch (err) {
    console.error("Error accepting request:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- Reject Connection Request ----------------
router.post("/reject/:requesterId", authMiddleware, async (req, res) => {
  try {
    const { requesterId } = req.params;
    const currentUserId = req.user._id;
    const io = req.app.get("io");

    const requester = await User.findById(requesterId);
    const receiver = await User.findById(currentUserId);

    if (!requester || !receiver) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Remove from pending
    receiver.receivedRequests = receiver.receivedRequests.filter(
      (id) => String(id) !== String(requesterId)
    );
    requester.sentRequests = requester.sentRequests.filter(
      (id) => String(id) !== String(currentUserId)
    );

    await receiver.save();
    await requester.save();

    // Emit WebSocket event to requester if online
    if (global.onlineUsers.has(requesterId)) {
      global.onlineUsers.get(requesterId).forEach((socketId) => {
        io.to(socketId).emit("requestRejected", {
          byUserId: currentUserId.toString(),
          byUserName: `${receiver.firstname} ${receiver.lastname}`,
        });
      });
    }

    // Return updated user state
    const updatedReceiver = await User.findById(currentUserId)
      .select("sentRequests receivedRequests connections")
      .populate("sentRequests", "firstname lastname username profilePic")
      .populate("receivedRequests", "firstname lastname username profilePic")
      .populate("connections", "firstname lastname username profilePic");

    res.json({ msg: "Connection rejected", currentUser: updatedReceiver });
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
