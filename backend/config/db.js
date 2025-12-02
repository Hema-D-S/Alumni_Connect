const mongoose = require("mongoose");

// Set mongoose options for better compatibility
mongoose.set("strictQuery", false);

const connectDB = async () => {
  try {
    // Validate MONGO_URI exists
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI environment variable is not set");
      process.exit(1);
    }

    // Production-optimized connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    await mongoose.connect(process.env.MONGO_URI, options);

    const isProduction = process.env.NODE_ENV === "production";
    const dbHost = mongoose.connection.host;

    if (isProduction) {
      console.log(`✅ MongoDB Connected (Production): ${dbHost}`);
    } else {
      console.log(`🔗 MongoDB Connected (Development): ${dbHost}`);
    }
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);

    // In development, log more details
    if (process.env.NODE_ENV !== "production") {
      console.error("Full error details:", error);
    }

    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("🔴 Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected from MongoDB");
});

// Graceful shutdown for production deployment
process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received. Closing MongoDB connection...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed.");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received. Closing MongoDB connection...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed.");
  process.exit(0);
});

module.exports = connectDB;
