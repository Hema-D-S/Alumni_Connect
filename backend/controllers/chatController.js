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
    }).sort({ createdAt: 1 });

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
