const mongoose = require("mongoose");
const Post = require("../models/post");
require("dotenv").config();

const migratePosts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/alumni_connect"
    );
    console.log("Connected to MongoDB");

    // Find posts without category or with invalid category
    const postsToUpdate = await Post.find({
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: "" },
        {
          category: {
            $nin: ["dashboard", "student-achievements", "alumni-highlights"],
          },
        },
      ],
    });

    console.log(`Found ${postsToUpdate.length} posts to update`);

    if (postsToUpdate.length > 0) {
      // Update posts to have default category
      const result = await Post.updateMany(
        {
          $or: [
            { category: { $exists: false } },
            { category: null },
            { category: "" },
            {
              category: {
                $nin: [
                  "dashboard",
                  "student-achievements",
                  "alumni-highlights",
                ],
              },
            },
          ],
        },
        { $set: { category: "dashboard" } }
      );

      console.log(
        `Updated ${result.modifiedCount} posts with default category "dashboard"`
      );
    }

    // Also fix any posts with missing or empty text
    const postsWithoutText = await Post.find({
      $or: [{ text: { $exists: false } }, { text: null }, { text: "" }],
    });

    console.log(`Found ${postsWithoutText.length} posts without text`);

    if (postsWithoutText.length > 0) {
      const textResult = await Post.updateMany(
        {
          $or: [{ text: { $exists: false } }, { text: null }, { text: "" }],
        },
        { $set: { text: "Shared a post" } }
      );

      console.log(
        `Updated ${textResult.modifiedCount} posts with default text`
      );
    }

    // Show summary of all posts
    const allPosts = await Post.find({}).select(
      "_id category text user createdAt"
    );
    console.log("\nAll posts summary:");
    allPosts.forEach((post) => {
      console.log(
        `- ID: ${post._id}, Category: ${
          post.category
        }, Text: "${post.text?.substring(0, 50)}...", Created: ${
          post.createdAt
        }`
      );
    });

    console.log("\nMigration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migratePosts();
