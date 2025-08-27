// routes/connectionRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const User = require("../models/user");

module.exports = (io) => {
  // ---------------- Send Connection Request ----------------
  router.post("/send/:targetUserId", authMiddleware, async (req, res) => {
    try {
      const { targetUserId } = req.params;
      const currentUserId = req.user._id;

      const currentUser = await User.findById(currentUserId);
      const targetUser = await User.findById(targetUserId);

      // Check if already connected or request exists
      if (
        currentUser.connections.includes(targetUserId) ||
        currentUser.sentRequests.includes(targetUserId) ||
        currentUser.receivedRequests.includes(targetUserId)
      ) {
        return res.status(400).json({ msg: "Request cannot be sent." });
      }

      currentUser.sentRequests.push(targetUserId);
      targetUser.receivedRequests.push(currentUserId);

      await currentUser.save();
      await targetUser.save();

      // Emit to target user in real-time
      if (global.onlineUsers.has(targetUserId.toString())) {
        io.to(global.onlineUsers.get(targetUserId.toString())).emit(
          "requestReceived",
          {
            fromUserId: currentUserId.toString(),
          }
        );
      }

      res.json({ msg: "Request sent" });
    } catch (err) {
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  });

  // ---------------- Accept Connection Request ----------------
  router.post("/accept/:requesterId", authMiddleware, async (req, res) => {
    try {
      const { requesterId } = req.params;
      const currentUserId = req.user._id;

      const currentUser = await User.findById(currentUserId);
      const requester = await User.findById(requesterId);

      if (!currentUser.receivedRequests.includes(requesterId)) {
        return res.status(400).json({ msg: "No request found." });
      }

      // Remove from requests
      currentUser.receivedRequests = currentUser.receivedRequests.filter(
        (id) => id.toString() !== requesterId
      );
      requester.sentRequests = requester.sentRequests.filter(
        (id) => id.toString() !== currentUserId.toString()
      );

      // Add to connections
      currentUser.connections.push(requesterId);
      requester.connections.push(currentUserId);

      await currentUser.save();
      await requester.save();

      // Emit to requester that request was accepted
      if (global.onlineUsers.has(requesterId.toString())) {
        io.to(global.onlineUsers.get(requesterId.toString())).emit(
          "requestAccepted",
          {
            userId: currentUserId.toString(),
          }
        );
      }

      res.json({ msg: "Request accepted" });
    } catch (err) {
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  });

  // ---------------- Reject Connection Request ----------------
  router.post("/reject/:requesterId", authMiddleware, async (req, res) => {
    try {
      const { requesterId } = req.params;
      const currentUserId = req.user._id;

      const currentUser = await User.findById(currentUserId);
      const requester = await User.findById(requesterId);

      // Remove from requests
      currentUser.receivedRequests = currentUser.receivedRequests.filter(
        (id) => id.toString() !== requesterId
      );
      requester.sentRequests = requester.sentRequests.filter(
        (id) => id.toString() !== currentUserId.toString()
      );

      await currentUser.save();
      await requester.save();

      // Emit to requester that request was rejected
      if (global.onlineUsers.has(requesterId.toString())) {
        io.to(global.onlineUsers.get(requesterId.toString())).emit(
          "requestRejected",
          {
            userId: currentUserId.toString(),
          }
        );
      }

      res.json({ msg: "Request rejected" });
    } catch (err) {
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  });

  return router;
};
