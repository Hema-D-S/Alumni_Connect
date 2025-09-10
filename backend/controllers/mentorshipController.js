const MentorshipProgram = require("../models/MentorshipProgram");
const User = require("../models/user");

// Get all mentorship programs
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await MentorshipProgram.find({ isActive: true })
      .populate("mentor", "firstname lastname profilePic batch role")
      .populate("participants", "firstname lastname profilePic")
      .sort({ createdAt: -1 });

    res.json(programs);
  } catch (err) {
    console.error("Error fetching programs:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get programs by category
exports.getProgramsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const programs = await MentorshipProgram.find({
      category,
      isActive: true,
    })
      .populate("mentor", "firstname lastname profilePic batch role")
      .populate("participants", "firstname lastname profilePic")
      .sort({ createdAt: -1 });

    res.json(programs);
  } catch (err) {
    console.error("Error fetching programs by category:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Create a new mentorship program (Only Alumni can create)
exports.createProgram = async (req, res) => {
  try {
    // Check if user is alumni
    const user = await User.findById(req.user.id);
    if (user.role !== "alumni") {
      return res.status(403).json({
        msg: "Access denied. Only alumni can create mentorship programs.",
      });
    }

    const {
      title,
      description,
      category,
      duration,
      maxParticipants,
      requirements,
      startDate,
      endDate,
      meetingSchedule,
      mode,
      location,
      meetingLink,
      platform,
      applicationDeadline,
    } = req.body;

    // Validate mode-specific fields
    if (mode === "offline" && !location) {
      return res.status(400).json({
        msg: "Location is required for offline programs",
      });
    }

    if (mode === "online" && (!meetingLink || !platform)) {
      return res.status(400).json({
        msg: "Meeting link and platform are required for online programs",
      });
    }

    const program = new MentorshipProgram({
      title,
      description,
      mentor: req.user.id,
      category,
      duration,
      maxParticipants,
      requirements,
      startDate,
      endDate,
      meetingSchedule,
      mode,
      location: mode === "offline" ? location : undefined,
      meetingLink: mode === "online" ? meetingLink : undefined,
      platform: mode === "online" ? platform : undefined,
      applicationDeadline,
    });

    await program.save();
    await program.populate(
      "mentor",
      "firstname lastname profilePic batch role"
    );

    res.status(201).json(program);
  } catch (err) {
    console.error("Error creating program:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Apply to a mentorship program
exports.applyToProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const program = await MentorshipProgram.findById(id);
    if (!program) {
      return res.status(404).json({ msg: "Program not found" });
    }

    // Check if user is already a participant
    if (program.participants.includes(userId)) {
      return res.status(400).json({ msg: "Already applied to this program" });
    }

    // Check if program is full
    if (program.participants.length >= program.maxParticipants) {
      return res.status(400).json({ msg: "Program is full" });
    }

    // Check if application deadline has passed
    if (
      program.applicationDeadline &&
      new Date() > program.applicationDeadline
    ) {
      return res.status(400).json({ msg: "Application deadline has passed" });
    }

    program.participants.push(userId);
    await program.save();

    res.json({ msg: "Successfully applied to program" });
  } catch (err) {
    console.error("Error applying to program:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get programs where user is mentor
exports.getMyMentorPrograms = async (req, res) => {
  try {
    const programs = await MentorshipProgram.find({ mentor: req.user.id })
      .populate("participants", "firstname lastname profilePic batch role")
      .sort({ createdAt: -1 });

    res.json(programs);
  } catch (err) {
    console.error("Error fetching mentor programs:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get programs where user is participant
exports.getMyParticipantPrograms = async (req, res) => {
  try {
    const programs = await MentorshipProgram.find({
      participants: req.user.id,
    })
      .populate("mentor", "firstname lastname profilePic batch role")
      .sort({ createdAt: -1 });

    res.json(programs);
  } catch (err) {
    console.error("Error fetching participant programs:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update program (only mentor can update)
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await MentorshipProgram.findById(id);

    if (!program) {
      return res.status(404).json({ msg: "Program not found" });
    }

    if (program.mentor.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    const updatedProgram = await MentorshipProgram.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    ).populate("mentor", "firstname lastname profilePic batch role");

    res.json(updatedProgram);
  } catch (err) {
    console.error("Error updating program:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete program (only mentor can delete)
exports.deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const program = await MentorshipProgram.findById(id);

    if (!program) {
      return res.status(404).json({ msg: "Program not found" });
    }

    if (program.mentor.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await MentorshipProgram.findByIdAndDelete(id);
    res.json({ msg: "Program deleted successfully" });
  } catch (err) {
    console.error("Error deleting program:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
