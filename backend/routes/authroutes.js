const express = require("express");
const {
  register,
  login,
  googleAuth,
  linkedinAuth,
  getProfile,
  updateProfile,
} = require("../controllers/authcontroller");
const {
  authMiddleware,
  authorizeRoles,
} = require("../middlewares/authmiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/linkedin", linkedinAuth);

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

router.get(
  "/admin/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ msg: "Welcome to Admin Dashboard" });
  }
);

router.get(
  "/alumni/resources",
  authMiddleware,
  authorizeRoles("alumni"),
  (req, res) => {
    res.json({ msg: "Exclusive Alumni Resources" });
  }
);

module.exports = router;
