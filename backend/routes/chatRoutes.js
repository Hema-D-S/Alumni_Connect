const express = require("express");
const {
  getMessages,
  getRecentConversations,
} = require("../controllers/chatController");
const { authMiddleware } = require("../middlewares/authmiddleware");

const router = express.Router();

// Get recent conversations (must be before /:userId route)
router.get("/recent", authMiddleware, getRecentConversations);

// Mark messages as read
router.put("/mark-read", authMiddleware, async (req, res) => {
  try {
    const { messageIds, fromUserId } = req.body;
    const currentUserId = req.user._id;

    const Message = require("../models/Message");
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        from: fromUserId,
        to: currentUserId,
        status: { $ne: "read" },
      },
      {
        status: "read",
        readAt: new Date(),
      }
    );

    // Notify sender via Socket.IO
    if (req.app.get("io")) {
      const io = req.app.get("io");
      const senderSockets = global.onlineUsers.get(fromUserId) || [];
      senderSockets.forEach((id) => {
        io.to(id).emit("messagesRead", {
          userId: currentUserId,
          messageIds: messageIds,
        });
      });
    }

    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Get unread message count for a specific user
router.get("/unread/count", authMiddleware, async (req, res) => {
  try {
    const Message = require("../models/Message");
    const currentUserId = req.user._id;
    const { userId } = req.query;

    const query = {
      to: currentUserId,
      status: { $in: ["sent", "delivered"] },
    };

    if (userId) {
      query.from = userId;
    }

    const unreadCount = await Message.countDocuments(query);

    res.json({ unreadCount });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

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
