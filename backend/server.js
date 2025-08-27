const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ---------------- Socket.IO Setup ----------------
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track online users
global.onlineUsers = global.onlineUsers || new Map();

io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("join", (userId) => {
    if (!global.onlineUsers.has(userId)) global.onlineUsers.set(userId, []);
    global.onlineUsers.get(userId).push(socket.id);
    console.log("Online users:", global.onlineUsers);
  });

  // Register userId when connected
  socket.on("register", (userId) => {
    if (!global.onlineUsers.has(userId)) global.onlineUsers.set(userId, []);
    global.onlineUsers.get(userId).push(socket.id);
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
    console.log("A user disconnected:", socket.id);
  });
});

// Make io accessible in routes/controllers
app.set("io", io);

// ---------------- Middleware ----------------
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- Routes ----------------
const authRoutes = require("./routes/authroutes");
const postRoutes = require("./routes/postRoutes");
const findUsersRoutes = require("./routes/FindUsers");
const connectionRoutes = require("./routes/connectionRoutes")(io); // pass io if needed

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/findusers", findUsersRoutes);
app.use("/api/connections", connectionRoutes);

// ---------------- Test Route ----------------
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
