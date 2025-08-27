import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

// Replace these with actual MongoDB ObjectIds from your DB
const userId = "64f3a8b1e2a4d56b9c123456"; // Your user ID
const otherUserId = "64f3a8b1e2a4d56b9c123457"; // The other user's ID

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Join chat
  socket.emit("joinChat", userId);

  // Listen for messages
  socket.on("receiveMessage", (data) => {
    console.log("New message:", data);
  });

  // Send a test message immediately
  socket.emit("sendMessage", {
    toUserId: otherUserId,
    message: "Hello!",
  });
});
