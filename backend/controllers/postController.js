const Post = require("../models/post");
const fs = require("fs");
const path = require("path");

// ---------------- CREATE POST ----------------
const createPost = async (req, res) => {
  try {
    console.log("Creating post - Request body:", req.body);
    console.log("Creating post - File:", req.file);
    console.log("Creating post - User:", req.user);

    const { text, category } = req.body;

    console.log("Extracted text:", text);
    console.log("Text length:", text ? text.length : "undefined");
    console.log("Text value:", JSON.stringify(text));
    console.log("Extracted category:", category);
    console.log("Has file:", !!req.file);

    // Validate that we have either text or a file
    if ((!text || text.trim().length === 0) && !req.file) {
      console.log("Validation failed - no text or file provided");
      return res.status(400).json({
        error: "Post must have either text content or a file attachment",
      });
    }

    // If no text but has file, use default text
    const postText =
      text && text.trim().length > 0 ? text.trim() : "Shared an achievement";

    const newPost = new Post({
      user: req.user.id,
      text: postText,
      category: category || "dashboard", // default to dashboard if not specified
      file: req.file ? `uploads/${req.file.filename}` : undefined,
    });

    console.log("New post object:", newPost);

    const savedPost = await newPost.save();
    console.log("Post saved successfully:", savedPost._id);

    //  Populate user with profilePic before sending response
    const populatedPost = await Post.findById(savedPost._id)
      .populate("user", "firstname lastname username profilePic role batch")
      .populate("comments.user", "firstname lastname username profilePic");

    console.log("Post populated successfully");
    res.status(201).json({ post: populatedPost });
  } catch (err) {
    console.error("Error creating post:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
};

// ---------------- GET ALL POSTS ----------------
const getAllPosts = async (req, res) => {
  try {
    console.log("getAllPosts - Query params:", req.query);

    const {
      page = 1,
      limit = 10,
      role,
      category,
      sort = "-createdAt",
    } = req.query;

    // Build query filter
    let filter = {};

    // If category filter is specified, add it to the query
    if (category) {
      filter.category = category;
      console.log("getAllPosts - Category filter applied:", category);
    }

    // If role filter is specified, add it to the query
    if (role) {
      // First get users with the specified role
      const User = require("../models/user");
      const usersWithRole = await User.find({ role: role }).select("_id");
      const userIds = usersWithRole.map((user) => user._id);
      filter.user = { $in: userIds };
      console.log(
        "getAllPosts - Role filter applied:",
        role,
        "Users found:",
        userIds.length
      );
    }

    console.log("getAllPosts - Final filter:", filter);

    // Get total count for debugging
    const totalPosts = await Post.countDocuments(filter);
    console.log("getAllPosts - Total posts matching filter:", totalPosts);

    const posts = await Post.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "firstname lastname username profilePic role batch")
      .populate("comments.user", "firstname lastname username profilePic");

    console.log("getAllPosts - Posts returned:", posts.length);
    console.log(
      "getAllPosts - Posts sample:",
      posts
        .slice(0, 2)
        .map((p) => ({
          id: p._id,
          category: p.category,
          user: p.user?.username,
        }))
    );

    res.json({ posts, total: totalPosts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: err.message });
  }
};

// ---------------- GET POST BY ID ----------------
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "firstname lastname username profilePic role batch")
      .populate("comments.user", "firstname lastname username profilePic");

    if (!post) return res.status(404).json({ msg: "Post not found" });

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- UPDATE POST ----------------
const updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });
    if (post.user.toString() !== req.user.id)
      return res.status(403).json({ msg: "Not authorized" });

    post.text = req.body.text || post.text;
    if (req.file) post.file = `uploads/${req.file.filename}`;

    await post.save();

    post = await post.populate(
      "user",
      "firstname lastname username profilePic role batch"
    );

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- DELETE POST ----------------
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    // Only owner or admin
    if (post.user.toString() !== req.user.id && !req.user.isAdmin)
      return res.status(403).json({ msg: "Not authorized" });

    await Post.deleteOne({ _id: post._id }); // safer than remove
    res.json({ msg: "Post removed successfully", postId: post._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ---------------- LIKE POST ----------------
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ error: "Post already liked" });
    }

    post.likes.push(req.user.id);
    await post.save();
    res.json({ msg: "Post liked", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ---------------- UNLIKE POST ----------------
const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const index = post.likes.indexOf(req.user.id);
    if (index === -1)
      return res.status(400).json({ error: "Post not liked yet" });

    post.likes.splice(index, 1);
    await post.save();
    res.json({ msg: "Post unliked", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// ---------------- ADD COMMENT ----------------
const addComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Comment text is required" });

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = { user: req.user.id, text };
    post.comments.push(comment);
    await post.save();

    await post.populate(
      "comments.user",
      "firstname lastname username profilePic"
    );

    res.status(200).json({ msg: "Comment added", comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- DELETE COMMENT ----------------
const deleteComment = async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.find((c) => c._id.toString() === commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Only allow the comment owner or post owner to delete
    if (
      comment.user.toString() !== req.user.id &&
      post.user.toString() !== req.user.id
    ) {
      return res
        .status(401)
        .json({ error: "Not authorized to delete comment" });
    }

    // Remove comment
    post.comments = post.comments.filter((c) => c._id.toString() !== commentId);
    await post.save();

    await post.populate(
      "comments.user",
      "firstname lastname username profilePic"
    );

    res.status(200).json({ msg: "Comment deleted", comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- UPDATE COMMENT ----------------
const updateComment = async (req, res) => {
  const { postId, commentId } = req.params;
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "Comment text is required" });

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.find((c) => c._id.toString() === commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    // Only allow the comment owner to edit
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ error: "Not authorized to edit comment" });
    }

    // Update comment text
    comment.text = text;
    comment.updatedAt = new Date();
    await post.save();

    await post.populate(
      "comments.user",
      "firstname lastname username profilePic"
    );

    res.status(200).json({ msg: "Comment updated", comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------- EXPORT ALL ----------------
module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  addComment,
  updateComment,
  deleteComment,
};
