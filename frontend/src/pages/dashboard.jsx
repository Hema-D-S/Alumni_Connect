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
  const [showComments, setShowComments] = useState({});

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

  // Fetch connected users for chat
  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          // Use only connected users for chat sidebar
          setChatUsers(data.connections || []);
        }
      } catch (err) {
        console.error("Error fetching connected users:", err);
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

  // Like a post
  const handleLike = async (postId) => {
    try {
      const currentPost = posts.find((post) => post._id === postId);
      const isLiked = currentPost.likes.includes(user._id);

      const endpoint = isLiked ? "unlike" : "like";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${endpoint}/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        // Update the post with new like count and liked status
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likes: isLiked
                    ? post.likes.filter((id) => id !== user._id)
                    : [...post.likes, user._id],
                }
              : post
          )
        );
      }
    } catch (err) {
      console.error("Error liking/unliking post:", err);
    }
  };

  // Add comment to a post
  const handleAddComment = async (postId, commentText) => {
    if (!commentText.trim()) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/comment/${postId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: commentText }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        // Update the post with new comments array
        setPosts(
          posts.map((post) =>
            post._id === postId ? { ...post, comments: data.comments } : post
          )
        );
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
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
                <button
                  className={`dashboard-footer-btn ${
                    post.likes?.includes(user?._id) ? "liked" : ""
                  }`}
                  onClick={() => handleLike(post._id)}
                >
                  👍 {post.likes?.length || 0} Likes
                </button>
                <button
                  className="dashboard-footer-btn"
                  onClick={() => toggleComments(post._id)}
                >
                  💬 {post.comments?.length || 0} Comments
                </button>
                <button
                  className="dashboard-footer-btn"
                  onClick={() => {
                    const comment = prompt("Add a comment:");
                    if (comment) handleAddComment(post._id, comment);
                  }}
                >
                  ➕ Add Comment
                </button>
                <button className="dashboard-footer-btn">↪️ Share</button>
              </div>

              {/* Comments Section */}
              {showComments[post._id] && (
                <div className="dashboard-comments-section">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment, index) => (
                      <div key={index} className="dashboard-comment">
                        <img
                          src={getProfilePicUrl(comment.user?.profilePic)}
                          alt="Profile"
                          className="dashboard-comment-avatar"
                        />
                        <div className="dashboard-comment-content">
                          <div className="dashboard-comment-header">
                            <span className="dashboard-comment-author">
                              {comment.user?.firstname} {comment.user?.lastname}
                            </span>
                            <span className="dashboard-comment-time">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="dashboard-comment-text">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="dashboard-no-comments">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              )}
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
              <p>No connections yet</p>
              <small>Connect with alumni to start chatting</small>
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
