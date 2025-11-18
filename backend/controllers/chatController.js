const Message = require("../models/Message");

// Fetch all messages between current user and another user
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId, to: currentUserId },
      ],
    })
      .populate("from", "firstname lastname username profilePic")
      .populate("to", "firstname lastname username profilePic")
      .sort({ createdAt: 1 });

    // Mark messages as delivered if they were sent to current user
    const unreadMessages = messages.filter(
      (msg) =>
        msg.to._id.toString() === currentUserId &&
        msg.status !== "read" &&
        msg.status !== "delivered"
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg._id);
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          to: currentUserId,
          status: "sent",
        },
        {
          status: "delivered",
        }
      );

      // Update messages in response
      messages.forEach((msg) => {
        if (
          messageIds.some((id) => id.toString() === msg._id.toString()) &&
          msg.status === "sent"
        ) {
          msg.status = "delivered";
        }
      });
    }

    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get recent conversations for the current user
const getRecentConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // Get latest message for each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        },
      },
      {
        $addFields: {
          otherUser: {
            $cond: {
              if: { $eq: ["$from", currentUserId] },
              then: "$to",
              else: "$from",
            },
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          from: { $first: "$from" },
          to: { $first: "$to" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastMessageTime: 1,
          from: 1,
          to: 1,
          "userInfo.firstname": 1,
          "userInfo.lastname": 1,
          "userInfo.profilePic": 1,
          "userInfo.username": 1,
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json(conversations);
  } catch (err) {
    console.error("Error fetching recent conversations:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = { getMessages, getRecentConversations };
