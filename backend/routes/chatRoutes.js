const express = require("express");
const { getMessages } = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/authmiddleware");

const router = express.Router();

// Fetch chat history with a specific user
router.get("/:userId", authMiddleware, getMessages);

// Optional: keep POST route if you want HTTP fallback (messages still saved in DB)
router.post("/:userId", authMiddleware, async (req, res) => {
  const { message } = req.body;
  const toUserId = req.params.userId;
  const fromUserId = req.user._id;

  try {
    const Message = require("../models/Message");
    const newMessage = await Message.create({
      from: fromUserId,
      to: toUserId,
      text: message,
    });

    // Emit via Socket.IO if receiver is online
    if (req.app.get("io")) {
      const io = req.app.get("io");
      const receiverSockets = global.onlineUsers.get(toUserId) || [];
      receiverSockets.forEach((id) => {
        io.to(id).emit("receiveMessage", newMessage);
      });
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
