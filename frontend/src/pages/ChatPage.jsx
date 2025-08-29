import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import LeftSidebar from "../components/LeftSidebar";
import { io } from "socket.io-client";
import "../styles/ChatPage.css";

/* ------------------- Decode JWT ------------------- */
function decodeUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload?.id || null; // backend signs { id: user._id }
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
}

const ChatPage = () => {
  /* ------------------- States ------------------- */
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [selfId, setSelfId] = useState(
    () => localStorage.getItem("userId") || null
  );

  /* ------------------- Refs ------------------- */
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedUserRef = useRef(null);

  /* ------------------- Update selectedUserRef ------------------- */
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  /* ------------------- Decode SelfId from token ------------------- */
  useEffect(() => {
    if (!selfId) {
      const decoded = decodeUserIdFromToken();
      if (decoded) {
        setSelfId(decoded);
        localStorage.setItem("userId", decoded);
      }
    }
  }, [selfId]);

  /* ------------------- Setup Socket.IO ------------------- */
  useEffect(() => {
    socketRef.current = io("import.meta.env.VITE_API_URL", {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () =>
      console.log("Socket connected:", socketRef.current.id)
    );
    socketRef.current.on("connect_error", (err) =>
      console.error("Socket connection error:", err)
    );
    socketRef.current.on("disconnect", () =>
      console.log("Socket disconnected")
    );

    // Receive Message
    socketRef.current.on("receiveMessage", (message) => {
      const su = selectedUserRef.current;
      if (!su) return;

      // Normalize IDs
      const fromId =
        typeof message.from === "object" ? message.from?._id : message.from;
      const toId =
        typeof message.to === "object" ? message.to?._id : message.to;

      const involvesCurrentPair =
        (fromId?.toString() === su._id?.toString() &&
          toId?.toString() === selfId?.toString()) ||
        (fromId?.toString() === selfId?.toString() &&
          toId?.toString() === su._id?.toString());

      if (!involvesCurrentPair) return;

      setMessages((prev) => {
        // Avoid duplicates
        if (message._id && prev.some((m) => m._id === message._id)) return prev;

        // Replace optimistic message with server-confirmed one
        const last = prev[prev.length - 1];
        const msgText = message.text || message.message;
        const lastText = last ? last.text || last.message : null;
        if (
          last &&
          !last?._id &&
          (lastText || "") === (msgText || "") &&
          (typeof last.from === "object"
            ? last.from?._id
            : last.from
          )?.toString() === selfId?.toString()
        ) {
          return [...prev.slice(0, -1), message];
        }

        return [...prev, message];
      });
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [selfId]);

  /* ------------------- Join Chat ------------------- */
  useEffect(() => {
    if (socketRef.current && selfId) {
      console.log("Joining chat as:", selfId);
      socketRef.current.emit("joinChat", selfId);
    }
  }, [selfId]);

  /* ------------------- Fetch Connected Users ------------------- */
  useEffect(() => {
    const fetchConnectedUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await axios.get(
          "import.meta.env.VITE_API_URL/api/connections",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const usersArray = Array.isArray(res.data)
          ? res.data
          : res.data.connections || [];

        setConnectedUsers(usersArray.filter((user) => user && user._id));
      } catch (err) {
        console.error("Error fetching connected users:", err);
        setConnectedUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchConnectedUsers();
  }, []);

  /* ------------------- Fetch Messages ------------------- */
  const fetchMessages = async (user) => {
    if (!user || !user._id) return;
    try {
      setLoadingMessages(true);
      const res = await axios.get(
        `import.meta.env.VITE_API_URL/api/chat/${user._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessages(res.data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  /* ------------------- Scroll to Bottom after messages update ------------------- */
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ------------------- Handle User Click ------------------- */
  const handleUserClick = (user) => {
    if (!user || !user._id) return;
    setSelectedUser(user);
    fetchMessages(user);
  };

  /* ------------------- Handle Send Message ------------------- */
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !selfId) return;

    const text = newMessage.trim();
    const optimisticMessage = {
      from: selfId,
      to: selectedUser._id,
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      socketRef.current?.emit("sendMessage", {
        toUserId: selectedUser._id,
        message: text,
      });
    } catch (err) {
      console.error("Socket emit failed:", err);
    }
  };

  /* ------------------- Helpers ------------------- */
  const getFromId = (msg) =>
    typeof msg.from === "object" ? msg.from?._id : msg.from;

  /* ------------------- UI ------------------- */
  return (
    <div className="chatpage-wrapper">
      {/* Left Sidebar */}
      <LeftSidebar active="chat" />

      {/* Chat Middle */}
      <div className="chatpage-middle">
        {selectedUser ? (
          <>
            <div className="chatpage-header">
              Chat with {selectedUser.firstname} {selectedUser.lastname}
            </div>

            {/* Messages */}
            <div className="chatpage-messages">
              {loadingMessages ? (
                <p>Loading messages...</p>
              ) : messages.length === 0 ? (
                <p>No messages yet.</p>
              ) : (
                messages.map((msg, idx) => {
                  const isSent =
                    getFromId(msg)?.toString() === selfId?.toString();
                  return (
                    <div
                      key={msg._id || idx}
                      className={`chatpage-message ${
                        isSent ? "sent" : "received"
                      }`}
                    >
                      {msg.text || msg.message}
                      <span className="chatpage-timestamp">
                        {new Date(
                          msg.timestamp || msg.createdAt || Date.now()
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chatpage-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </>
        ) : (
          <p className="chatpage-placeholder">
            Select a connection to start chatting.
          </p>
        )}
      </div>

      {/* Right Connections */}
      <div className="chatpage-right">
        <h3>Connections</h3>
        {loadingUsers ? (
          <p>Loading users...</p>
        ) : connectedUsers.length === 0 ? (
          <p>No connections found.</p>
        ) : (
          connectedUsers.map((user) => (
            <div
              key={user._id}
              className={`chatpage-user ${
                selectedUser?._id?.toString() === user._id?.toString()
                  ? "selected"
                  : ""
              }`}
              onClick={() => handleUserClick(user)}
            >
              <img
                src={
                  user.profilePic
                    ? `import.meta.env.VITE_API_URL/${user.profilePic}`
                    : "https://via.placeholder.com/40"
                }
                alt={user.firstname}
              />
              <span>
                {user.firstname} {user.lastname}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatPage;
