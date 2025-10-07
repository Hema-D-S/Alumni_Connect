const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: false }, // Made optional to allow file-only posts
    image: { type: String }, // optional: image path
    video: { type: String }, // optional: video path
    file: { type: String }, // optional: file path
    category: {
      type: String,
      enum: ["dashboard", "student-achievements", "alumni-highlights"],
      default: "dashboard",
    }, // post category
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
