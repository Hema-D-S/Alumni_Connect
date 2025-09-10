import React, { useEffect, useState } from "react";
import axios from "axios";
import LeftSidebar from "../components/LeftSidebar";
import { FaPaperPlane, FaUserPlus } from "react-icons/fa";
import io from "socket.io-client";
import "../styles/FindUsers.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

// Connect to socket
const socket = io(import.meta.env.VITE_WS_URL || "http://localhost:5000");

const FindUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showSentRequests, setShowSentRequests] = useState(false);
  const [showReceivedRequests, setShowReceivedRequests] = useState(false);

  const token = localStorage.getItem("token");

  // Close requests popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sentPopup = document.querySelector(".requests-popup.sent");
      const receivedPopup = document.querySelector(".requests-popup.received");

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
      <LeftSidebar user={currentUser} openProfileModal={() => {}} />

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
              <FaPaperPlane
                title="Sent Requests"
                onClick={() => setShowSentRequests(!showSentRequests)}
              />
              <FaUserPlus
                title="Received Requests"
                onClick={() => setShowReceivedRequests(!showReceivedRequests)}
              />
            </div>
          </div>
        </header>

        {/* Sent Requests */}
        {showSentRequests && (
          <div className="requests-popup sent">
            {users
              .filter((u) =>
                currentUser?.sentRequests.includes(u._id.toString())
              )
              .map((u) => (
                <div key={u._id} className="request-item">
                  {u.firstname} {u.lastname} (Pending)
                </div>
              ))}
          </div>
        )}

        {/* Received Requests */}
        {showReceivedRequests && (
          <div className="requests-popup received">
            {users
              .filter((u) =>
                currentUser?.receivedRequests.includes(u._id.toString())
              )
              .map((u) => (
                <div key={u._id} className="request-item">
                  {u.firstname} {u.lastname}
                  <button onClick={() => handleAccept(u._id)}>Accept</button>
                  <button onClick={() => handleReject(u._id)}>Reject</button>
                </div>
              ))}
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
