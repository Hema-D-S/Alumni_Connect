import React, { useEffect, useState, useCallback } from "react";
import "../styles/Dashboard.css";
import { FaThumbsUp, FaRegComment, FaEllipsisV } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import { getApiUrl, getBaseUrl } from "../config/environment";
import { useUser } from "../hooks/useUser";

const Dashboard = () => {
  // Use global user context
  const { user, updateUser, loading } = useUser();
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
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostComments, setSelectedPostComments] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  const token = localStorage.getItem("token");
  const BASE_URL = getBaseUrl();
  const API_URL = getApiUrl();
  const navigate = useNavigate();

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      navigate("/auth");
    }
  }, [token, navigate]);

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
  // User fetching is now handled by UserContext - no need for local fetch

  // Fetch connected users for chat
  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        console.log(" Fetching connections from:", `${API_URL}/connections`);

        const res = await fetch(`${API_URL}/connections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        console.log(" Connections response status:", res.status);
        console.log(" Connections response data:", data);

        if (res.ok) {
          // Use only connected users for chat sidebar
          setChatUsers(data.connections || []);
          console.log(" Connections loaded:", data.connections?.length || 0);
        } else {
          console.error(" Connections fetch failed:", data.msg);
          if (res.status === 401) {
            console.error(" Authentication failed for connections");
          }
        }
      } catch (err) {
        console.error(" Error fetching connected users:", err);
      }
    };
    if (token && user) fetchChatUsers();
  }, [token, user, API_URL]);

  // Fetch posts with pagination for better performance
  const fetchPosts = useCallback(async () => {
    try {
      console.log("Dashboard - Fetching posts with category filter: dashboard");
      const url = `${API_URL}/posts?category=dashboard&limit=20&sort=-createdAt`;
      console.log("Dashboard - Request URL:", url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Dashboard - Response status:", res.status);

      const data = await res.json();
      console.log("Dashboard - Response data:", data);

      if (res.ok) {
        setPosts(data.posts || []);
        console.log("Dashboard - Posts loaded:", data.posts?.length || 0);
        console.log("Dashboard - Posts sample:", data.posts?.slice(0, 2));
      } else {
        console.error(
          "Dashboard - Posts fetch failed:",
          data.msg || data.error
        );
      }
    } catch (err) {
      console.error("Dashboard - Error fetching posts:", err);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (token) fetchPosts();
  }, [token, fetchPosts]);

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("text", newPostText);
    formData.append("category", "dashboard");
    if (postFile) formData.append("file", postFile);

    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setPosts([data.post, ...posts]);
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
      const res = await fetch(`${API_URL}/posts/${endpoint}/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

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

  // Add comment to a post (for modal)
  const handleAddComment = async () => {
    if (!newCommentText.trim() || !selectedPostId) return;

    try {
      const res = await fetch(`${API_URL}/posts/comment/${selectedPostId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newCommentText }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update both the posts state and selected post comments
        setPosts(
          posts.map((post) =>
            post._id === selectedPostId
              ? { ...post, comments: data.comments }
              : post
          )
        );
        setSelectedPostComments(data.comments);
        setNewCommentText("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Open comment modal
  const openCommentModal = (post) => {
    setSelectedPostId(post._id);
    setSelectedPostComments(post.comments || []);
    setShowCommentModal(true);
    setNewCommentText("");
  };

  // Close comment modal
  const closeCommentModal = () => {
    setShowCommentModal(false);
    setSelectedPostId(null);
    setSelectedPostComments([]);
    setEditingComment(null);
    setEditCommentText("");
    setNewCommentText("");
  };

  // Delete comment
  const handleDeleteComment = async (postId, commentId) => {
    try {
      const res = await fetch(
        `${API_URL}/posts/comment/${postId}/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        // Remove the comment from the post
        const updatedPosts = posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.filter((c) => c._id !== commentId),
              }
            : post
        );
        setPosts(updatedPosts);

        // Update modal comments if modal is open for this post
        if (selectedPostId === postId) {
          setSelectedPostComments((prev) =>
            prev.filter((c) => c._id !== commentId)
          );
        }
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Update comment
  const handleUpdateComment = async (postId, commentId, newText) => {
    try {
      const res = await fetch(
        `${API_URL}/posts/comment/${postId}/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newText }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Update the post with updated comments
        setPosts(
          posts.map((post) =>
            post._id === postId ? { ...post, comments: data.comments } : post
          )
        );

        // Update modal comments if modal is open for this post
        if (selectedPostId === postId) {
          setSelectedPostComments(data.comments);
        }

        setEditingComment(null);
        setEditCommentText("");
      }
    } catch (err) {
      console.error("Error updating comment:", err);
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
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        updateUser(data.user);
        setShowProfileModal(false);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  // Memoize handlers to prevent unnecessary re-renders
  const handleOpenProfileModal = useCallback(
    () => setShowProfileModal(true),
    []
  );

  // Show loading state if user data is still loading
  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loading-container">
          <div className="loading-spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <LeftSidebar openProfileModal={handleOpenProfileModal} />

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
                placeholder="What's on your mind? Share your thoughts, achievements, or updates..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                required
              />

              <div className="file-upload-container">
                <label htmlFor="postFileInput" className="file-upload-label">
                  <i className="fas fa-paperclip"></i>
                  {postFile
                    ? `Selected: ${postFile.name}`
                    : "Attach Photo/Document"}
                </label>
                <input
                  id="postFileInput"
                  type="file"
                  onChange={(e) => setPostFile(e.target.files[0])}
                  accept="image/*,video/*,.pdf,.docx"
                  style={{ display: "none" }}
                />
              </div>

              <div className="dashboard-actions">
                <button type="submit">
                  <i className="fas fa-paper-plane"></i>
                  Share Post
                </button>
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
                  className="dashboard-footer-btn comment-btn"
                  onClick={() => openCommentModal(post)}
                >
                  💬 {post.comments?.length || 0} Comments
                </button>
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
          <div className="dashboard-modal profile-modal">
            <div className="modal-header">
              <h2>Update Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            <div className="profile-modal-content">
              {/* Profile Picture Section */}
              <div className="profile-pic-section">
                <div className="current-profile-pic">
                  <img
                    src={
                      user?.profilePic
                        ? `${BASE_URL}/${user.profilePic}`
                        : "https://via.placeholder.com/120"
                    }
                    alt="Current Profile"
                  />
                </div>
                <div className="profile-pic-upload">
                  <label htmlFor="profilePicInput" className="upload-label">
                    <i className="fas fa-camera"></i>
                    Change Photo
                  </label>
                  <input
                    id="profilePicInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePicFile(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                  {profilePicFile && (
                    <small className="file-selected">
                      {profilePicFile.name} selected
                    </small>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="profile-form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={firstnameInput}
                    onChange={(e) => setFirstnameInput(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={lastnameInput}
                    onChange={(e) => setLastnameInput(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="disabled-field"
                    title="Email cannot be changed"
                  />
                </div>

                <div className="form-group">
                  <label>Batch Year</label>
                  <input
                    type="number"
                    value={user?.batch || ""}
                    disabled
                    className="disabled-field"
                    title="Batch year cannot be changed"
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    value={user?.role || ""}
                    disabled
                    className="disabled-field"
                    title="Role is automatically determined by batch year"
                  />
                </div>
              </div>
            </div>

            <div className="dashboard-modal-actions">
              <button onClick={handleUpdateProfile} className="save-btn">
                <i className="fas fa-save"></i> Save Changes
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="cancel-btn"
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-comment-modal">
            <div className="dashboard-comment-modal-header">
              <h3>Comments</h3>
              <button
                onClick={closeCommentModal}
                className="dashboard-modal-close"
              >
                ×
              </button>
            </div>

            <div className="dashboard-comment-modal-body">
              {/* Add Comment Input */}
              <div className="dashboard-add-comment">
                <img
                  src={getProfilePicUrl(user?.profilePic)}
                  alt="Your Profile"
                  className="dashboard-comment-avatar"
                />
                <div className="dashboard-comment-input-container">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment();
                      }
                    }}
                    className="dashboard-comment-input"
                  />
                  <button
                    onClick={handleAddComment}
                    className="dashboard-comment-submit"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Existing Comments */}
              <div className="dashboard-comments-list">
                {selectedPostComments && selectedPostComments.length > 0 ? (
                  selectedPostComments.map((comment) => (
                    <div key={comment._id} className="dashboard-comment">
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
                          {/* Edit/Delete buttons for user's own comments */}
                          {comment.user?._id === user?._id && (
                            <div className="dashboard-comment-actions">
                              <button
                                onClick={() => {
                                  setEditingComment(comment._id);
                                  setEditCommentText(comment.text);
                                }}
                                className="dashboard-comment-edit"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteComment(
                                    selectedPostId,
                                    comment._id
                                  )
                                }
                                className="dashboard-comment-delete"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        {editingComment === comment._id ? (
                          <div className="dashboard-edit-comment">
                            <input
                              type="text"
                              value={editCommentText}
                              onChange={(e) =>
                                setEditCommentText(e.target.value)
                              }
                              className="dashboard-comment-input"
                            />
                            <div className="dashboard-edit-actions">
                              <button
                                onClick={() =>
                                  handleUpdateComment(
                                    selectedPostId,
                                    comment._id,
                                    editCommentText
                                  )
                                }
                                className="dashboard-comment-save"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingComment(null);
                                  setEditCommentText("");
                                }}
                                className="dashboard-comment-cancel"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="dashboard-comment-text">
                            {comment.text}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="dashboard-no-comments">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
