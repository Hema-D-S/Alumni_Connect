const express = require("express");
const fs = require("fs");
const path = require("path");
const Post = require("../models/post");

const router = express.Router();

// Check file existence and clean up broken references
router.get("/check-files", async (req, res) => {
  try {
    console.log("Checking file integrity...");
    
    // Get all posts with files
    const postsWithFiles = await Post.find({ file: { $exists: true, $ne: null } });
    
    const results = {
      total: postsWithFiles.length,
      existing: 0,
      missing: 0,
      missingFiles: []
    };
    
    for (const post of postsWithFiles) {
      const filePath = path.join(__dirname, "../", post.file);
      
      if (fs.existsSync(filePath)) {
        results.existing++;
      } else {
        results.missing++;
        results.missingFiles.push({
          postId: post._id,
          file: post.file,
          createdAt: post.createdAt
        });
        
        // Optional: Remove file reference from post
        // await Post.findByIdAndUpdate(post._id, { $unset: { file: 1 } });
      }
    }
    
    console.log("File check results:", results);
    res.json(results);
    
  } catch (error) {
    console.error("Error checking files:", error);
    res.status(500).json({ error: "Failed to check files" });
  }
});

// Clean up missing file references
router.post("/cleanup-missing", async (req, res) => {
  try {
    const postsWithFiles = await Post.find({ file: { $exists: true, $ne: null } });
    let cleanedCount = 0;
    
    for (const post of postsWithFiles) {
      const filePath = path.join(__dirname, "../", post.file);
      
      if (!fs.existsSync(filePath)) {
        await Post.findByIdAndUpdate(post._id, { $unset: { file: 1 } });
        cleanedCount++;
      }
    }
    
    res.json({ 
      message: `Cleaned up ${cleanedCount} posts with missing files`,
      cleanedCount 
    });
    
  } catch (error) {
    console.error("Error cleaning up files:", error);
    res.status(500).json({ error: "Failed to cleanup files" });
  }
});

module.exports = router;