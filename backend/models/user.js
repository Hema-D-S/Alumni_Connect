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
    googleId: { type: String },
    profilePic: { type: String, default: "/uploads/default-profile-black.png" },
    batch: { type: Number, required: true },
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    receivedRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },

  { timestamps: true }
);
userSchema.pre("save", function (next) {
  const currentYear = new Date().getFullYear();
  if (this.batch < currentYear) {
    this.role = "alumni";
  } else if (this.batch >= currentYear) {
    this.role = "student";
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
