const express = require("express");
const {
  getMessages,
  getRecentConversations,
} = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/authmiddleware");

const router = express.Router();

// Get recent conversations (must be before /:userId route)
router.get("/recent", authMiddleware, getRecentConversations);

// Fetch chat history with a specific user
router.get("/:userId", authMiddleware, getMessages);

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

// Edit message
router.put("/:id", async (req, res) => {
  try {
    const { text, userId } = req.body;

    let message = await Message.findById(req.params.id);

    // Only sender can edit
    if (message.from.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to edit" });
    }

    message.text = text;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message
router.delete("/:id", async (req, res) => {
  try {
    const { userId } = req.body;

    let message = await Message.findById(req.params.id);

    // Only sender can delete
    if (message.from.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized to delete" });
    }

    await message.deleteOne();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
