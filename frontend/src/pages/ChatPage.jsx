import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import LeftSidebar from "../components/LeftSidebar";
import { io } from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "../styles/ChatPage.css";
import "../styles/Dashboard.css"; // For ProfileModal styles
import { getApiUrl, getBaseUrl, getWsUrl } from "../config/environment";

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
    return payload?.id || null;
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
}

const ChatPage = () => {
  const API = getApiUrl();
  const BASE_URL = getBaseUrl();

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ------------------- URL Parameters ------------------- */
  const [searchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get("userId");

  /* ------------------- Refs ------------------- */
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedUserRef = useRef(null);

  /* ------------------- Keep selectedUserRef updated ------------------- */
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
    const SOCKET_URL = getWsUrl();
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () =>
      console.log("Socket connected:", socketRef.current.id)
    );

    socketRef.current.on("disconnect", () =>
      console.log("Socket disconnected")
    );

    // Receive messages
    socketRef.current.on("receiveMessage", (message) => {
      const su = selectedUserRef.current;
      if (!su) return;

      const fromId = message.from?._id || message.from;
      const toId = message.to?._id || message.to;

      const involvesCurrentPair =
        (fromId?.toString() === su._id?.toString() &&
          toId?.toString() === selfId?.toString()) ||
        (fromId?.toString() === selfId?.toString() &&
          toId?.toString() === su._id?.toString());

      if (!involvesCurrentPair) return;

      setMessages((prev) => {
        // Avoid duplicates
        if (message._id && prev.some((m) => m._id === message._id)) return prev;

        // Replace optimistic message with server-confirmed message
        const last = prev[prev.length - 1];
        const lastText = last ? last.text || last.message : null;
        const msgText = message.text || message.message;

        if (
          last &&
          !last._id &&
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
  }, [selfId, API]);

  /* ------------------- Join Chat ------------------- */
  useEffect(() => {
    if (socketRef.current && selfId) {
      socketRef.current.emit("joinChat", selfId);
    }
  }, [selfId]);

  /* ------------------- Fetch Connected Users & Current User ------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingUsers(true);
        const token = localStorage.getItem("token");

        // Fetch current user profile (now handled by UserContext)
        // Current user is available from global context

        // Fetch connected users
        const connectionsRes = await axios.get(`${API}/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConnectedUsers(connectionsRes.data.connections || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setConnectedUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchData();
  }, [API]);

  /* ------------------- Fetch Messages ------------------- */
  const fetchMessages = useCallback(
    async (user) => {
      if (!user || !user._id) return;
      try {
        setLoadingMessages(true);
        const res = await axios.get(`${API}/chat/${user._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setMessages(res.data || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [API]
  );

  /* ------------------- Auto-select user from URL ------------------- */
  useEffect(() => {
    if (userIdFromUrl && connectedUsers.length > 0 && !selectedUser) {
      const targetUser = connectedUsers.find(
        (user) => user._id === userIdFromUrl
      );
      if (targetUser) {
        setSelectedUser(targetUser);
        fetchMessages(targetUser);
      }
    }
  }, [userIdFromUrl, connectedUsers, selectedUser, fetchMessages]);

  /* ------------------- Scroll to Bottom ------------------- */
  useEffect(() => {
    if (messages.length > 0)
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ------------------- Handlers ------------------- */
  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchMessages(user);
  };

  const handleSendMessage = () => {
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

    socketRef.current?.emit("sendMessage", {
      toUserId: selectedUser._id,
      message: text,
    });
  };

  const getFromId = (msg) =>
    typeof msg.from === "object" ? msg.from?._id : msg.from;

  return (
    <div className="chatpage-wrapper">
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${isMobileMenuOpen ? "active" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <LeftSidebar
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      <div className="chatpage-middle">
        {selectedUser ? (
          <>
            <div className="chatpage-header">
              Chat with {selectedUser.firstname} {selectedUser.lastname}
            </div>

            <div className="chatpage-messages">
              {loadingMessages ? (
                <p className="loading-text">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="loading-text">No messages yet.</p>
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

      <div className="chatpage-right">
        <h3>Connections</h3>
        {loadingUsers ? (
          <p className="loading-text">Loading users...</p>
        ) : connectedUsers.length === 0 ? (
          <p className="loading-text">No connections found.</p>
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
                    ? `${BASE_URL}/${user.profilePic}`
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
