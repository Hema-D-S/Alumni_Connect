const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const upload = require("../middlewares/postMiddleware"); // destructured
const {
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
} = require("../controllers/postController");

// Create a new post
router.post("/", authMiddleware, upload.single("file"), createPost);

// Get all posts
router.get("/", authMiddleware, getAllPosts);

// Get post by id
router.get("/:id", authMiddleware, getPostById);

// Update post
router.put("/:id", authMiddleware, upload.single("file"), updatePost);

// Delete post
router.delete("/:id", authMiddleware, deletePost);

// Like / Unlike
router.put("/like/:id", authMiddleware, likePost);
router.put("/unlike/:id", authMiddleware, unlikePost);

// Add comment
router.post("/comment/:id", authMiddleware, addComment);

// Update comment
router.put("/comment/:postId/:commentId", authMiddleware, updateComment);

// Delete comment
router.delete("/comment/:postId/:commentId", authMiddleware, deleteComment);

module.exports = router;
