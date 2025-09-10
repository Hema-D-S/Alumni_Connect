const mongoose = require("mongoose");

const mentorshipProgramSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Career Guidance",
        "Technical Skills",
        "Leadership",
        "Entrepreneurship",
        "Personal Development",
      ],
      required: true,
    },
    duration: { type: String, required: true }, // e.g., "3 months", "6 weeks"
    maxParticipants: { type: Number, default: 10 },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requirements: { type: String },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    meetingSchedule: { type: String }, // e.g., "Weekly on Fridays, 6 PM"

    // New fields for online/offline mode
    mode: {
      type: String,
      enum: ["online", "offline"],
      required: true,
    },
    location: {
      type: String,
      required: function () {
        return this.mode === "offline";
      },
    },
    meetingLink: {
      type: String,
      required: function () {
        return this.mode === "online";
      },
    },
    platform: {
      type: String,
      enum: ["zoom", "gmeet", "teams", "other"],
      required: function () {
        return this.mode === "online";
      },
    },
    applicationDeadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MentorshipProgram", mentorshipProgramSchema);
