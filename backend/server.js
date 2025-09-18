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
const io = new Server(server, {
  cors: {
    origin: [
      "https://alumni-connect-oe7z.vercel.app", // Production
      "https://alumni-connect-jd5g.vercel.app", // Your new Vercel URL
      "https://alumni-connect-jd5g-git-main-hemas-projects-0ff36fde.vercel.app", // Preview URL
      "https://alumni-connect-jd5g-l2gtxq7id-hemas-projects-0ff36fde.vercel.app", // Preview URL
      "http://localhost:5173", // Local development
      "http://localhost:3000", // Alternative local port
    ],
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
app.use(express.json());
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin: [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000",
      "https://alumni-connect-oe7z.vercel.app",
    ],
    credentials: true,
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- Routes ----------------
const authRoutes = require("./routes/authroutes");
const postRoutes = require("./routes/postRoutes");
const findUsersRoutes = require("./routes/FindUsers");
const connectionRoutes = require("./routes/connectionRoutes")(io);
const chatRoutes = require("./routes/chatRoutes");
const mentorshipRoutes = require("./routes/mentorshipRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/findusers", findUsersRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/mentorship", mentorshipRoutes);

// Test route
app.get("/", (req, res) => res.send("API running..."));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
