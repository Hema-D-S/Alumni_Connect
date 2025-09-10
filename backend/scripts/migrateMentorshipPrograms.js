const mongoose = require("mongoose");
const MentorshipProgram = require("../models/MentorshipProgram");

// Connect to MongoDB
mongoose.connect(
  process.env.MONGO_URI || "mongodb://localhost:27017/alumni_connect",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

async function migrateMentorshipPrograms() {
  try {
    console.log("Starting migration of mentorship programs...");

    // Find all programs that don't have a mode field
    const programsWithoutMode = await MentorshipProgram.updateMany(
      { mode: { $exists: false } },
      { $set: { mode: "online" } } // Set default mode to 'online'
    );

    console.log(
      `Updated ${programsWithoutMode.modifiedCount} programs with default mode 'online'`
    );

    // Find all programs that don't have platform field for online programs
    const onlineProgramsWithoutPlatform = await MentorshipProgram.updateMany(
      {
        mode: "online",
        platform: { $exists: false },
      },
      { $set: { platform: "zoom" } } // Set default platform to 'zoom'
    );

    console.log(
      `Updated ${onlineProgramsWithoutPlatform.modifiedCount} online programs with default platform 'zoom'`
    );

    // Find all programs that don't have meetingLink field for online programs
    const onlineProgramsWithoutLink = await MentorshipProgram.updateMany(
      {
        mode: "online",
        meetingLink: { $exists: false },
      },
      { $set: { meetingLink: "TBD" } } // Set placeholder meeting link
    );

    console.log(
      `Updated ${onlineProgramsWithoutLink.modifiedCount} online programs with placeholder meeting link`
    );

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateMentorshipPrograms();
