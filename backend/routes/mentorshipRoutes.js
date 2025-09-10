const express = require("express");
const {
  getAllPrograms,
  getProgramsByCategory,
  createProgram,
  applyToProgram,
  getMyMentorPrograms,
  getMyParticipantPrograms,
  updateProgram,
  deleteProgram,
} = require("../controllers/mentorshipController");
const { authMiddleware } = require("../middlewares/authmiddleware");

const router = express.Router();

// Public routes
router.get("/", getAllPrograms);
router.get("/category/:category", getProgramsByCategory);

// Protected routes
router.post("/", authMiddleware, createProgram);
router.post("/apply/:id", authMiddleware, applyToProgram);
router.get("/my-mentor-programs", authMiddleware, getMyMentorPrograms);
router.get(
  "/my-participant-programs",
  authMiddleware,
  getMyParticipantPrograms
);
router.put("/:id", authMiddleware, updateProgram);
router.delete("/:id", authMiddleware, deleteProgram);

module.exports = router;
