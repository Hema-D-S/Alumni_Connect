import React, { useEffect, useState, useCallback } from "react";
import "../styles/Dashboard.css";
import { FaThumbsUp, FaRegComment, FaEllipsisV } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [postFile, setPostFile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [firstnameInput, setFirstnameInput] = useState("");
  const [lastnameInput, setLastnameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");
  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
  const navigate = useNavigate();

  // Helper to get profile pic URL
  const getProfilePicUrl = (pic) => {
    if (!pic) return "https://via.placeholder.com/100";
    if (pic.startsWith("http")) return pic;
    return `${BASE_URL}/${pic}`;
  };

  // Handle chat click navigation
  const handleChatClick = (userId) => {
    navigate(`/chat?userId=${userId}`);
  };

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok) setUser(data.user);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    if (token) fetchUser();
  }, [token]);

  // Fetch users for chat (connections)
  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/findusers/all`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (res.ok) {
          // Filter out current user and limit to 5-6 users for chat sidebar
          const filteredUsers = data
            .filter((u) => u._id !== user?._id)
            .slice(0, 6);
          setChatUsers(filteredUsers);
        }
      } catch (err) {
        console.error("Error fetching chat users:", err);
      }
    };
    if (token && user) fetchChatUsers();
  }, [token, user]);

  // Fetch all posts
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPosts(data.posts || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchPosts();
  }, [token, fetchPosts]);

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("text", newPostText);
    if (postFile) formData.append("file", postFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setPosts([data, ...posts]);
        setNewPostText("");
        setPostFile(null);
      }
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  // Update Profile
  const handleUpdateProfile = async () => {
    const formData = new FormData();
    formData.append("firstname", firstnameInput);
    formData.append("lastname", lastnameInput);
    formData.append("username", usernameInput);
    formData.append("phone", phoneInput);
    if (profilePicFile) formData.append("profilePic", profilePicFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setShowProfileModal(false);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <LeftSidebar
        user={user}
        openProfileModal={() => setShowProfileModal(true)}
      />

      {/* MAIN FEED */}
      <main className="dashboard-feed">
        <header className="dashboard-topbar">
          <div className="dashboard-app-title">Alumni Connect</div>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        <div className="dashboard-feed-scroll">
          {/* Post Creator */}
          <div className="dashboard-create-post">
            <form onSubmit={handleCreatePost}>
              <input
                type="text"
                placeholder="Start making your post..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                required
              />
              <input
                type="file"
                onChange={(e) => setPostFile(e.target.files[0])}
                accept="image/*,video/*,.pdf,.docx"
              />
              <div className="dashboard-actions">
                <button type="submit">Post</button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          {posts.map((post) => (
            <div key={post._id} className="dashboard-post">
              <div className="dashboard-post-header">
                <img
                  src={getProfilePicUrl(post.user?.profilePic)}
                  alt="Profile"
                />
                <div>
                  <h3>{post.user?.firstname || "Unknown User"}</h3>
                  <p>{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p className="dashboard-post-text">{post.text}</p>
              {post.file &&
                (post.file.endsWith(".pdf") ? (
                  <a
                    href={`${BASE_URL}/${post.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dashboard-post-file"
                  >
                    📄 View PDF
                  </a>
                ) : (
                  <img
                    src={`${BASE_URL}/${post.file}`}
                    alt="Post"
                    className="dashboard-post-image"
                  />
                ))}
              <div className="dashboard-post-footer">
                <span>👍 {post.likes?.length || 0} Likes</span>
                <span>💬 {post.comments?.length || 0} Comments</span>
                <span>↪️ Share</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* RIGHT SIDEBAR - CHATS */}
      <aside className="dashboard-chat">
        <div className="dashboard-chat-header">Connect & Chat</div>
        <div className="dashboard-chat-scroll">
          {chatUsers.length === 0 ? (
            <div className="dashboard-no-chats">
              <p>No users to chat with</p>
            </div>
          ) : (
            chatUsers.map((chatUser) => (
              <div
                key={chatUser._id}
                className="dashboard-chat-user-card"
                onClick={() => handleChatClick(chatUser._id)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={getProfilePicUrl(chatUser.profilePic)}
                  alt={chatUser.firstname}
                  className="dashboard-chat-user-avatar"
                />
                <div className="dashboard-chat-user-info">
                  <p className="dashboard-chat-user-name">
                    {chatUser.firstname} {chatUser.lastname}
                  </p>
                  <span className="dashboard-chat-user-role">
                    {chatUser.role}
                  </span>
                  <p className="dashboard-chat-user-batch">
                    Batch: {chatUser.batch || "N/A"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <h2>Update Profile</h2>
            <input
              type="text"
              value={firstnameInput}
              onChange={(e) => setFirstnameInput(e.target.value)}
              placeholder="First Name"
            />
            <input
              type="text"
              value={lastnameInput}
              onChange={(e) => setLastnameInput(e.target.value)}
              placeholder="Last Name"
            />
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Username"
            />
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Phone"
            />
            <input
              type="file"
              onChange={(e) => setProfilePicFile(e.target.files[0])}
            />
            <div className="dashboard-modal-actions">
              <button onClick={handleUpdateProfile}>Save</button>
              <button onClick={() => setShowProfileModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
