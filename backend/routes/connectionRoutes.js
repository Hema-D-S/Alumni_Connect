// routes/connectionRoutes.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authmiddleware");
const { getConnections } = require("../controllers/connectionController");

// import controller functions for requests
const {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
} = require("../controllers/FindUsersController");

module.exports = (io) => {
  // ---------------- Fetch Connected Users ----------------
  router.get("/", authMiddleware, getConnections);

  // ---------------- Send Connection Request ----------------
  router.post("/send/:targetUserId", authMiddleware, (req, res) =>
    sendConnectionRequest(req, res, io)
  );

  // ---------------- Accept Connection Request ----------------
  router.post("/accept/:requesterId", authMiddleware, (req, res) =>
    acceptConnectionRequest(req, res, io)
  );

  // ---------------- Reject Connection Request ----------------
  router.post("/reject/:requesterId", authMiddleware, (req, res) =>
    rejectConnectionRequest(req, res, io)
  );

  return router;
};
