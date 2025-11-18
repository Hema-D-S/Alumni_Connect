import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import LeftSidebar from "../components/LeftSidebar";
import { io } from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import { FaBars, FaTimes, FaSearch, FaCheck, FaCheckDouble, FaCircle } from "react-icons/fa";
import "../styles/ChatPage.css";
import "../styles/Dashboard.css";
import { getApiUrl, getBaseUrl, getWsUrl } from "../config/environment";
import { getProfilePicUrl } from "../utils/imageUtils";
import { debounce } from "../utils/performance.js";

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
  const [isMobileConnectionsOpen, setIsMobileConnectionsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const typingTimeoutRef = useRef(null);

  /* ------------------- URL Parameters ------------------- */
  const [searchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get("userId");

  /* ------------------- Refs ------------------- */
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedUserRef = useRef(null);
  const inputRef = useRef(null);

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

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current.id);
      // Request list of online users (if backend supports it)
      // For now, we'll track based on socket events
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
    });

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

      if (!involvesCurrentPair) {
        // Update unread count for other conversations
        if (toId?.toString() === selfId?.toString()) {
          setUnreadCounts((prev) => ({
            ...prev,
            [fromId?.toString()]: (prev[fromId?.toString()] || 0) + 1,
          }));
        }
        return;
      }

      setMessages((prev) => {
        if (message._id && prev.some((m) => m._id === message._id)) return prev;

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

      // Mark as read if user is viewing the conversation
      if (toId?.toString() === selfId?.toString()) {
        markMessagesAsRead([message._id], fromId?.toString());
      }
    });

    // Typing indicator
    socketRef.current.on("userTyping", ({ userId, isTyping: typing }) => {
      if (selectedUserRef.current?._id?.toString() === userId?.toString()) {
        setOtherUserTyping(typing);
        if (typing) {
          setTimeout(() => setOtherUserTyping(false), 3000);
        }
      }
    });

    // Messages read notification
    socketRef.current.on("messagesRead", ({ userId, messageIds }) => {
      if (selectedUserRef.current?._id?.toString() === userId?.toString()) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg._id)
              ? { ...msg, status: "read", readAt: new Date() }
              : msg
          )
        );
      }
    });

    // Online/offline status
    socketRef.current.on("userOnline", ({ userId }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.add(userId?.toString());
        return newSet;
      });
    });

    socketRef.current.on("userOffline", ({ userId }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId?.toString());
        return newSet;
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

  /* ------------------- Fetch Connected Users & Unread Counts ------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingUsers(true);
        const token = localStorage.getItem("token");

        // Fetch connected users
        const connectionsRes = await axios.get(`${API}/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const users = connectionsRes.data.connections || [];
        setConnectedUsers(users);

        // Fetch unread counts for each user
        const counts = {};
        const unreadPromises = users.map(async (user) => {
          try {
            const unreadRes = await axios.get(
              `${API}/chat/unread/count`,
              {
                params: { userId: user._id },
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            return { userId: user._id, count: unreadRes.data.unreadCount || 0 };
          } catch (err) {
            return { userId: user._id, count: 0 };
          }
        });
        
        const unreadResults = await Promise.all(unreadPromises);
        unreadResults.forEach(({ userId, count }) => {
          counts[userId] = count;
        });
        setUnreadCounts(counts);
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
        
        // Mark all messages as read
        const unreadMessageIds = res.data
          .filter(
            (msg) =>
              (msg.from?._id || msg.from)?.toString() === user._id?.toString() &&
              msg.status !== "read"
          )
          .map((msg) => msg._id);
        
        if (unreadMessageIds.length > 0) {
          markMessagesAsRead(unreadMessageIds, user._id);
        }

        // Clear unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [user._id]: 0,
        }));
      } catch (err) {
        console.error("Error fetching messages:", err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [API]
  );

  /* ------------------- Mark Messages as Read ------------------- */
  const markMessagesAsRead = useCallback(
    async (messageIds, fromUserId) => {
      if (!messageIds.length || !fromUserId) return;

      try {
        await axios.put(
          `${API}/chat/mark-read`,
          { messageIds, fromUserId },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        // Emit via socket
        socketRef.current?.emit("markAsRead", {
          messageIds,
          fromUserId,
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
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
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, otherUserTyping]);

  /* ------------------- Typing Indicator Handler ------------------- */
  const handleTyping = useCallback(
    (isTyping) => {
      if (selectedUser && socketRef.current) {
        socketRef.current.emit("typing", {
          toUserId: selectedUser._id,
          isTyping: isTyping,
        });
      }
    },
    [selectedUser]
  );

  const debouncedTyping = useMemo(
    () => debounce(handleTyping, 300),
    [handleTyping]
  );

  /* ------------------- Handlers ------------------- */
  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchMessages(user);
    // Close mobile connections panel on mobile
    setIsMobileConnectionsOpen(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim() && !isTyping) {
      setIsTyping(true);
      debouncedTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      debouncedTyping(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser || !selfId) return;

    const text = newMessage.trim();
    const optimisticMessage = {
      from: selfId,
      to: selectedUser._id,
      text,
      timestamp: new Date(),
      status: "sent",
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setIsTyping(false);
    debouncedTyping(false);

    socketRef.current?.emit("sendMessage", {
      toUserId: selectedUser._id,
      message: text,
    });

    // Focus input after sending
    inputRef.current?.focus();
  };

  const getFromId = (msg) =>
    typeof msg.from === "object" ? msg.from?._id : msg.from;

  /* ------------------- Format Timestamp ------------------- */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
  };

  /* ------------------- Filtered Messages ------------------- */
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter((msg) =>
      (msg.text || msg.message)?.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  /* ------------------- Filtered Users ------------------- */
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return connectedUsers;
    const query = searchQuery.toLowerCase();
    return connectedUsers.filter(
      (user) =>
        user.firstname?.toLowerCase().includes(query) ||
        user.lastname?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query)
    );
  }, [connectedUsers, searchQuery]);

  /* ------------------- Group Messages by Date ------------------- */
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    const messagesToGroup = searchQuery.trim() ? filteredMessages : messages;

    messagesToGroup.forEach((msg) => {
      const msgDate = new Date(msg.createdAt || msg.timestamp);
      const dateStr = msgDate.toLocaleDateString();

      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({ type: "date", date: dateStr, messages: [] });
      }

      groups[groups.length - 1].messages.push(msg);
    });

    return groups;
  }, [messages, filteredMessages, searchQuery]);

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
        className={`mobile-overlay ${isMobileMenuOpen || isMobileConnectionsOpen ? "active" : ""}`}
        onClick={() => {
          setIsMobileMenuOpen(false);
          setIsMobileConnectionsOpen(false);
        }}
      ></div>

      <LeftSidebar
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      <div className="chatpage-middle">
        {selectedUser ? (
          <>
            <div className="chatpage-header">
              <div className="chatpage-header-info">
                <div className="chatpage-header-user">
                  <img
                    src={getProfilePicUrl(selectedUser.profilePic)}
                    alt={selectedUser.firstname}
                    className="chatpage-header-avatar"
                  />
                  <div>
                    <div className="chatpage-header-name">
                      {selectedUser.firstname} {selectedUser.lastname}
                    </div>
                    <div className="chatpage-header-status">
                      {onlineUsers.has(selectedUser._id?.toString()) ? (
                        <span className="status-online">
                          <FaCircle /> Online
                        </span>
                      ) : (
                        <span className="status-offline">Offline</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="chatpage-connections-toggle"
                  onClick={() => setIsMobileConnectionsOpen(!isMobileConnectionsOpen)}
                  aria-label="Toggle connections"
                >
                  <FaSearch />
                </button>
              </div>
            </div>

            <div className="chatpage-messages">
              {loadingMessages ? (
                <p className="loading-text">Loading messages...</p>
              ) : filteredMessages.length === 0 ? (
                <p className="loading-text">
                  {searchQuery ? "No messages found." : "No messages yet."}
                </p>
              ) : (
                <>
                  {groupedMessages.map((group, groupIdx) => (
                    <React.Fragment key={groupIdx}>
                      {group.type === "date" && (
                        <div className="chatpage-date-divider">
                          {new Date(group.date).toLocaleDateString([], {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      )}
                      {group.messages.map((msg, idx) => {
                        const isSent =
                          getFromId(msg)?.toString() === selfId?.toString();
                        return (
                          <div
                            key={msg._id || idx}
                            className={`chatpage-message ${
                              isSent ? "sent" : "received"
                            }`}
                          >
                            <div className="chatpage-message-content">
                              {msg.text || msg.message}
                            </div>
                            <div className="chatpage-message-footer">
                              <span className="chatpage-timestamp">
                                {formatTimestamp(
                                  msg.timestamp || msg.createdAt || Date.now()
                                )}
                              </span>
                              {isSent && (
                                <span className="chatpage-message-status">
                                  {msg.status === "read" ? (
                                    <FaCheckDouble className="status-read" />
                                  ) : msg.status === "delivered" ? (
                                    <FaCheckDouble className="status-delivered" />
                                  ) : (
                                    <FaCheck className="status-sent" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                  {otherUserTyping && (
                    <div className="chatpage-typing-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="typing-text">
                        {selectedUser.firstname} is typing...
                      </span>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chatpage-input">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="chatpage-send-btn"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="chatpage-placeholder">
            <div className="chatpage-placeholder-content">
              <div className="chatpage-placeholder-icon">💬</div>
              <h3>Select a connection to start chatting</h3>
              <p>Choose a user from the connections list to begin your conversation</p>
            </div>
          </div>
        )}
      </div>

      <div className={`chatpage-right ${isMobileConnectionsOpen ? "mobile-open" : ""}`}>
        <div className="chatpage-right-header">
          <div className="chatpage-right-header-top">
            <h3>Connections</h3>
            <button
              className="chatpage-close-connections"
              onClick={() => setIsMobileConnectionsOpen(false)}
              aria-label="Close connections"
            >
              <FaTimes />
            </button>
          </div>
          <div className="chatpage-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chatpage-search-input"
            />
          </div>
        </div>
        {loadingUsers ? (
          <p className="loading-text">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="loading-text">
            {searchQuery ? "No connections found." : "No connections found."}
          </p>
        ) : (
          <div className="chatpage-users-list">
            {filteredUsers.map((user) => {
              const unreadCount = unreadCounts[user._id] || 0;
              const isOnline = onlineUsers.has(user._id?.toString());
              return (
                <div
                  key={user._id}
                  className={`chatpage-user ${
                    selectedUser?._id?.toString() === user._id?.toString()
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleUserClick(user)}
                >
                  <div className="chatpage-user-avatar-wrapper">
                    <img
                      src={getProfilePicUrl(user.profilePic)}
                      alt={user.firstname}
                    />
                    {isOnline && <span className="online-indicator"></span>}
                  </div>
                  <div className="chatpage-user-info">
                    <span className="chatpage-user-name">
                      {user.firstname} {user.lastname}
                    </span>
                    {unreadCount > 0 && (
                      <span className="chatpage-unread-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
