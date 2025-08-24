const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: false },
    lastname: { type: String, required: false },
    username: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: { type: String, required: false },
    role: {
      type: String,
      enum: ["admin", "student", "alumni"],
      default: "student",
    },
    provider: {
      type: String,
      enum: ["local", "google", "linkedin"],
      default: "local",
    },
    googleId: { type: String }, // Google unique ID (sub)
    profilePic: { type: String, default: "" }, // store profile picture URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
