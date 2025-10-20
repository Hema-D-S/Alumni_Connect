import React, { useEffect, useState } from "react";
import axios from "axios";
import LeftSidebar from "../components/LeftSidebar";
import { FaPaperPlane, FaUserPlus, FaBars, FaTimes } from "react-icons/fa";
import io from "socket.io-client";
import "../styles/FindUsers.css";
import "../styles/Dashboard.css"; // For ProfileModal styles
import { getApiUrl, getBaseUrl, getWsUrl } from "../config/environment";

// Environment variables
const API = getApiUrl();
const BASE_URL = getBaseUrl();

// Connect to socket
const socket = io(getWsUrl());

const FindUsers = () => {
  // Keep local state for connection management (complex state)
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSentRequests, setShowSentRequests] = useState(false);
  const [showReceivedRequests, setShowReceivedRequests] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("token");

  // Close requests popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sentPopup = document.querySelector(".requests-popup.sent");
      const receivedPopup = document.querySelector(".requests-popup.received");
      const requestIcons = document.querySelector(".request-icons");

      // Don't close if clicking on the icons themselves
      if (requestIcons && requestIcons.contains(e.target)) {
        return;
      }

      if (
        (showSentRequests && sentPopup && !sentPopup.contains(e.target)) ||
        (showReceivedRequests &&
          receivedPopup &&
          !receivedPopup.contains(e.target))
      ) {
        setShowSentRequests(false);
        setShowReceivedRequests(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSentRequests, showReceivedRequests]);

  // Fetch users + current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API}/findusers`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(res.data.users || []);
        setSuggested((res.data.users || []).slice(0, 4));
        setCurrentUser({
          ...res.data.currentUser,
          connections: res.data.currentUser.connections.map(String),
          sentRequests: res.data.currentUser.sentRequests.map(String),
          receivedRequests: res.data.currentUser.receivedRequests.map(String),
        });

        // Register user with socket
        if (res.data.currentUser?._id) {
          socket.emit("register", res.data.currentUser._id);
        }
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };

    fetchUsers();
  }, [token]);

  // Socket event listeners
  useEffect(() => {
    if (!currentUser) return;

    socket.on("requestReceived", ({ fromUserId }) => {
      setCurrentUser((prev) => ({
        ...prev,
        receivedRequests: [...prev.receivedRequests, fromUserId.toString()],
      }));
      setUsers((prev) =>
        prev.map((u) =>
          u._id.toString() === fromUserId.toString()
            ? { ...u, requestStatus: "Pending for Me" }
            : u
        )
      );
    });

    socket.on("requestAccepted", ({ byUserId }) => {
      setCurrentUser((prev) => ({
        ...prev,
        connections: [...prev.connections, byUserId.toString()],
        sentRequests: prev.sentRequests.filter(
          (id) => id !== byUserId.toString()
        ),
        receivedRequests: prev.receivedRequests.filter(
          (id) => id !== byUserId.toString()
        ),
      }));
    });

    socket.on("requestRejected", ({ byUserId }) => {
      setCurrentUser((prev) => ({
        ...prev,
        sentRequests: prev.sentRequests.filter(
          (id) => id !== byUserId.toString()
        ),
      }));
    });

    return () => {
      socket.off("requestReceived");
      socket.off("requestAccepted");
      socket.off("requestRejected");
    };
  }, [currentUser]);

  // --- Handlers ---
  const handleConnect = async (targetUserId) => {
    if (!currentUser) return;
    try {
      await axios.post(
        `${API}/connections/send/${targetUserId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentUser((prev) => ({
        ...prev,
        sentRequests: [...prev.sentRequests, targetUserId.toString()],
      }));

      setUsers((prev) =>
        prev.map((user) =>
          user._id.toString() === targetUserId.toString()
            ? { ...user, requestStatus: "Request Sent" }
            : user
        )
      );
    } catch (err) {
      console.error(
        "Error sending connection request:",
        err.response?.data || err
      );
    }
  };

  const handleAccept = async (userId) => {
    try {
      await axios.post(
        `${API}/connections/accept/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentUser((prev) => ({
        ...prev,
        connections: [...prev.connections, userId.toString()],
        receivedRequests: prev.receivedRequests.filter(
          (id) => id !== userId.toString()
        ),
      }));
    } catch (err) {
      console.error("Error accepting request", err);
    }
  };

  const handleReject = async (userId) => {
    try {
      await axios.post(
        `${API}/connections/reject/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentUser((prev) => ({
        ...prev,
        receivedRequests: prev.receivedRequests.filter(
          (id) => id !== userId.toString()
        ),
      }));
    } catch (err) {
      console.error("Error rejecting request", err);
    }
  };

  // Connection status
  const getUserConnectionStatus = (u) => {
    if (!currentUser) return "Connect";
    const id = u._id.toString();
    if (currentUser.connections.includes(id)) return "Connected";
    if (currentUser.sentRequests.includes(id)) return "Request Sent";
    if (currentUser.receivedRequests.includes(id)) return "Pending for Me";
    return "Connect";
  };

  // Open user profile & posts
  const handleOpenUserProfile = async (user) => {
    try {
      const res = await axios.get(`${API}/posts/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserPosts(res.data.posts || []);
      setSelectedUser(user);
    } catch (err) {
      console.error("Error fetching user posts", err);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstname} ${u.lastname}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Helper to get profile pic URL
  const getProfilePicUrl = (pic) => {
    if (!pic) return "https://via.placeholder.com/100";
    if (pic.startsWith("http")) return pic;
    return `${BASE_URL}/${pic}`;
  };

  return (
    <div className="findusers-wrapper">
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

      <main className="findusers-main">
        <header className="findusers-topbar">
          <div className="findusers-app-title">Connect with People</div>
          <div className="findusers-search-container">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="request-icons">
              <div className="request-icon-container">
                <FaPaperPlane
                  title="Sent Requests"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSentRequests(!showSentRequests);
                    setShowReceivedRequests(false);
                  }}
                />
                {currentUser?.sentRequests?.length > 0 && (
                  <span className="request-badge">
                    {currentUser.sentRequests.length}
                  </span>
                )}
              </div>
              <div className="request-icon-container">
                <FaUserPlus
                  title="Received Requests"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReceivedRequests(!showReceivedRequests);
                    setShowSentRequests(false);
                  }}
                />
                {currentUser?.receivedRequests?.length > 0 && (
                  <span className="request-badge">
                    {currentUser.receivedRequests.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Sent Requests */}
        {showSentRequests && (
          <div
            className="requests-popup sent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="requests-popup-header">
              <h3>Sent Requests</h3>
              <button
                className="close-popup"
                onClick={() => setShowSentRequests(false)}
              >
                ×
              </button>
            </div>
            <div className="requests-list">
              {users
                .filter((u) =>
                  currentUser?.sentRequests.includes(u._id.toString())
                )
                .map((u) => (
                  <div key={u._id} className="request-item sent-item">
                    <img
                      src={
                        u.profilePic?.startsWith("http")
                          ? u.profilePic
                          : `${BASE_URL}/${u.profilePic}`
                      }
                      alt="Profile"
                      className="request-profile-pic"
                    />
                    <div className="request-info">
                      <div className="request-name">
                        {u.firstname} {u.lastname}
                      </div>
                      <div className="request-status">Pending</div>
                    </div>
                  </div>
                ))}
              {users.filter((u) =>
                currentUser?.sentRequests.includes(u._id.toString())
              ).length === 0 && (
                <div className="no-requests">No sent requests</div>
              )}
            </div>
          </div>
        )}

        {/* Received Requests */}
        {showReceivedRequests && (
          <div
            className="requests-popup received"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="requests-popup-header">
              <h3>Received Requests</h3>
              <button
                className="close-popup"
                onClick={() => setShowReceivedRequests(false)}
              >
                ×
              </button>
            </div>
            <div className="requests-list">
              {users
                .filter((u) =>
                  currentUser?.receivedRequests.includes(u._id.toString())
                )
                .map((u) => (
                  <div key={u._id} className="request-item received-item">
                    <img
                      src={
                        u.profilePic?.startsWith("http")
                          ? u.profilePic
                          : `${BASE_URL}/${u.profilePic}`
                      }
                      alt="Profile"
                      className="request-profile-pic"
                    />
                    <div className="request-info">
                      <div className="request-name">
                        {u.firstname} {u.lastname}
                      </div>
                      <div className="request-batch">
                        Batch {u.batch} • {u.role}
                      </div>
                    </div>
                    <div className="request-actions">
                      <button
                        className="accept-btn"
                        onClick={() => handleAccept(u._id)}
                      >
                        Accept
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleReject(u._id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              {users.filter((u) =>
                currentUser?.receivedRequests.includes(u._id.toString())
              ).length === 0 && (
                <div className="no-requests">No pending requests</div>
              )}
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="findusers-list">
          {filteredUsers.map((u) => {
            if (currentUser && u._id === currentUser._id) return null;
            const status = getUserConnectionStatus(u);

            return (
              <div
                key={u._id}
                className={`findusers-card ${
                  status === "Connected" ? "connected-card" : ""
                }`}
                onClick={() => handleOpenUserProfile(u)}
              >
                <img
                  src={getProfilePicUrl(u.profilePic)}
                  alt="Profile"
                  className="findusers-avatar"
                />
                <h3>
                  {u.firstname} {u.lastname}
                </h3>
                <p>Batch: {u.batch || "N/A"}</p>
                <p>Role: {u.role}</p>
                <p>Connections: {u.connections?.length || 0}</p>

                {status === "Pending for Me" ? (
                  <div className="pending-actions">
                    <button
                      className="accept-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(u._id);
                      }}
                    >
                      Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(u._id);
                      }}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <button
                    className={`findusers-connect-btn ${
                      status === "Connected" ? "connected" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (status === "Connect") handleConnect(u._id);
                    }}
                    disabled={
                      status === "Request Sent" || status === "Connected"
                    }
                  >
                    {status}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Suggested People */}
      <aside className="findusers-rightbar">
        <h3>Suggested People</h3>
        {suggested.map((u) => (
          <div key={u._id} className="findusers-suggested-card">
            <img
              src={getProfilePicUrl(u.profilePic)}
              alt="Profile"
              className="findusers-suggested-avatar"
            />
            <div>
              <p>
                {u.firstname} {u.lastname}
              </p>
              <span>{u.role}</span>
              <p>Connections: {u.connections?.length || 0}</p>
            </div>
          </div>
        ))}
      </aside>

      {/* Profile Modal */}
      {selectedUser && (
        <div className="findusers-modal-overlay">
          <div className="findusers-modal">
            <span
              className="findusers-close"
              onClick={() => setSelectedUser(null)}
            >
              &times;
            </span>
            <h2>
              {selectedUser.firstname} {selectedUser.lastname}’s Profile
            </h2>
            <p>
              <strong>Connections:</strong>{" "}
              {selectedUser.connections?.length || 0}
            </p>
            <h3>Posts</h3>
            <div className="findusers-posts">
              {userPosts.length === 0 ? (
                <p>No posts</p>
              ) : (
                userPosts.map((post) => (
                  <div key={post._id} className="findusers-post">
                    <p>{post.text}</p>
                    {post.file &&
                      (post.file.endsWith(".pdf") ? (
                        <a
                          href={`${API}/${post.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📄 View PDF
                        </a>
                      ) : (
                        <img src={`${API}/${post.file}`} alt="Post" />
                      ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindUsers;
