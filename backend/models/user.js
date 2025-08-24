const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: false },
    lastname: { type: String, required: false },
    phone: { type: String, required: false },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: { type: String, required: false }, // empty for Google users
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
    googleId: { type: String }, // <-- added to store Google’s unique ID (sub)
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
