const express = require("express");
const { getMessages } = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/authmiddleware");

module.exports = (io) => {
  const router = express.Router();

  // Fetch chat history with a specific user
  router.get("/:userId", authMiddleware, getMessages);

  // Optional: send message via HTTP (Socket.IO handles real-time)
  router.post("/:userId", authMiddleware, async (req, res) => {
    const { message } = req.body;
    const toUserId = req.params.userId;
    const fromUserId = req.user._id;

    // Emit to receiver sockets
    const sockets = global.onlineUsers.get(toUserId) || [];
    sockets.forEach((id) => {
      io.to(id).emit("receiveMessage", {
        from: fromUserId,
        message,
        timestamp: new Date(),
      });
    });

    // Save in DB
    const Message = require("../models/Message");
    const newMessage = await Message.create({
      from: fromUserId,
      to: toUserId,
      text: message,
    });

    res.status(201).json(newMessage);
  });

  return router;
};
