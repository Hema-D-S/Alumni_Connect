const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ---------------- Socket.IO Setup ----------------
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        process.env.FRONTEND_URL,
        /\.vercel\.app$/, // Allow all Vercel preview deployments
        /\.onrender\.com$/, // Allow Render deployments
      ].filter(Boolean)
    : [
        "http://localhost:5173", // Vite default
        "http://localhost:3000", // React default
        "http://localhost:5000", // Alternative local
      ];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track online users
global.onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Register user
  socket.on("register", (userId) => {
    socket.userId = userId;
    if (!global.onlineUsers.has(userId)) global.onlineUsers.set(userId, []);
    global.onlineUsers.get(userId).push(socket.id);
    console.log("Online users:", global.onlineUsers);
  });

  // Join chat room
  socket.on("joinChat", (userId) => {
    socket.userId = userId;
    if (!global.onlineUsers.has(userId)) global.onlineUsers.set(userId, []);
    global.onlineUsers.get(userId).push(socket.id);
  });

  // Send message
  socket.on("sendMessage", async ({ toUserId, message }) => {
    if (!socket.userId) return console.error("Sender not registered");

    console.log("sendMessage:", { from: socket.userId, toUserId, message });

    try {
      // Save message to DB
      const newMessage = await Message.create({
        from: socket.userId,
        to: toUserId,
        text: message,
      });

      // Send message to receiver if online
      const receiverSockets = global.onlineUsers.get(toUserId) || [];
      receiverSockets.forEach((id) => {
        io.to(id).emit("receiveMessage", newMessage);
      });

      // Also emit back to sender (for confirmation)
      socket.emit("receiveMessage", newMessage);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  });

  // Disconnect cleanup
  socket.on("disconnect", () => {
    for (let [userId, sockets] of global.onlineUsers.entries()) {
      const updatedSockets = sockets.filter((id) => id !== socket.id);
      if (updatedSockets.length === 0) {
        global.onlineUsers.delete(userId);
      } else {
        global.onlineUsers.set(userId, updatedSockets);
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

app.set("io", io);

// ---------------- Middleware ----------------
// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`📝 ${req.method} ${req.path} - ${new Date().toISOString()}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `✅ ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

app.use(express.json({ limit: "10mb" })); // Increase payload limit for file uploads

// Dynamic CORS configuration for development and production
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          process.env.FRONTEND_URL,
          /\.vercel\.app$/, // Allow all Vercel preview deployments
          /\.onrender\.com$/, // Allow Render deployments
        ].filter(Boolean)
      : [
          "http://localhost:5173", // Vite default
          "http://localhost:3000", // React default
          "http://localhost:5000", // Alternative local
        ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Static file serving with caching and compression
app.use(
  "/uploads",
  (req, res, next) => {
    // Set cache headers for uploaded files
    res.set({
      "Cache-Control": "public, max-age=86400", // 24 hours
      ETag: false,
      "Last-Modified": new Date().toUTCString(),
    });
    next();
  },
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1d", // 1 day cache
    etag: false,
    lastModified: false,
  })
);

// ---------------- Routes ----------------
const authRoutes = require("./routes/authroutes");
const postRoutes = require("./routes/postRoutes");
const findUsersRoutes = require("./routes/FindUsers");
const connectionRoutes = require("./routes/connectionRoutes")(io);
const chatRoutes = require("./routes/chatRoutes");
const mentorshipRoutes = require("./routes/mentorshipRoutes");
const fileRoutes = require("./routes/fileRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/findusers", findUsersRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/files", fileRoutes);

// API Health check route
app.get("/api", (req, res) => {
  res.json({
    message: "Alumni Connect API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    status: "healthy",
  });
});

// API Health check with detailed status
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Test route
app.get("/", (req, res) => res.send("API running..."));

// Test uploads directory
app.get("/test-uploads", (req, res) => {
  const fs = require("fs");
  const uploadPath = path.join(__dirname, "uploads");

  try {
    const files = fs.readdirSync(uploadPath);
    res.json({
      message: "Uploads directory accessible",
      uploadPath: uploadPath,
      filesCount: files.length,
      sampleFiles: files.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({
      error: "Cannot access uploads directory",
      uploadPath: uploadPath,
      errorMessage: error.message,
    });
  }
});

// 404 handler for unmatched routes
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
