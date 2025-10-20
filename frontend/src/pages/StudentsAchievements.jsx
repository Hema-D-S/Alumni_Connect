import React, { useEffect, useState, useCallback } from "react";
import "../styles/Dashboard.css";
import "../styles/StudentsAchievements.css";
import {
  FaThumbsUp,
  FaRegComment,
  FaEllipsisV,
  FaTrophy,
  FaCamera,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import { getApiUrl, getBaseUrl } from "../config/environment";
import { useUser } from "../hooks/useUser";

const StudentsAchievements = () => {
  // Use global user context
  const { user, loading } = useUser();
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostComments, setSelectedPostComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(true);
  // Post creation states
  const [newPostText, setNewPostText] = useState("");
  const [postFile, setPostFile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  // Menu state
  const [selectedPostMenu, setSelectedPostMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("token");
  const BASE_URL = getBaseUrl();
  const API_URL = getApiUrl();
  const navigate = useNavigate();

  // Fetch student posts only
  const fetchStudentPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch(
        `${API_URL}/posts?category=student-achievements&limit=20&sort=-createdAt`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
        console.log("Student posts loaded:", data.posts?.length || 0);
      } else {
        console.error("Student posts fetch failed:", data.msg);
      }
    } catch (err) {
      console.error("Error fetching student posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [API_URL, token]);

  // Fetch comments for a specific post
  const fetchComments = useCallback(
    async (postId) => {
      try {
        const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setSelectedPostComments(data.comments || []);
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    },
    [API_URL, token]
  );

  // Like/unlike a post
  const handleLike = useCallback(
    async (postId) => {
      try {
        const res = await fetch(`${API_URL}/posts/${postId}/like`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post._id === postId
                ? { ...post, likes: data.likes, likesCount: data.likesCount }
                : post
            )
          );
        }
      } catch (err) {
        console.error("Error liking post:", err);
      }
    },
    [API_URL, token]
  );

  // Add a comment
  const handleAddComment = useCallback(
    async (postId) => {
      if (!newCommentText.trim()) return;

      try {
        const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newCommentText }),
        });
        const data = await res.json();
        if (res.ok) {
          setSelectedPostComments((prev) => [...prev, data.comment]);
          setNewCommentText("");
          // Update post comments count
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post._id === postId
                ? { ...post, commentsCount: (post.commentsCount || 0) + 1 }
                : post
            )
          );
        }
      } catch (err) {
        console.error("Error adding comment:", err);
      }
    },
    [API_URL, token, newCommentText]
  );

  // Open comment modal
  const openCommentsModal = useCallback(
    (postId) => {
      setSelectedPostId(postId);
      setShowCommentModal(true);
      fetchComments(postId);
    },
    [fetchComments]
  );

  // Handle deleting a post
  const handleDeletePost = useCallback(
    async (postId) => {
      if (!window.confirm("Are you sure you want to delete this post?")) {
        return;
      }

      try {
        const res = await fetch(`${API_URL}/posts/${postId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setPosts((prevPosts) =>
            prevPosts.filter((post) => post._id !== postId)
          );
          setSelectedPostMenu(null);
        } else {
          console.error("Failed to delete post");
        }
      } catch (err) {
        console.error("Error deleting post:", err);
      }
    },
    [API_URL, token]
  );

  // Handle creating a new post
  const handleCreatePost = useCallback(
    async (e) => {
      console.log("handleCreatePost called");
      console.log("User:", user);
      console.log("Token:", token);
      console.log("Post text:", newPostText);
      console.log("Post text length:", newPostText ? newPostText.length : 0);
      console.log("Post text trimmed:", newPostText ? newPostText.trim() : "");
      console.log("Post file:", postFile);

      e.preventDefault();

      // Validate input - require either text OR file
      const hasText = newPostText && newPostText.trim().length > 0;
      const hasFile = postFile !== null;

      if (!hasText && !hasFile) {
        console.log("Post creation cancelled - no text or file provided");
        alert(
          "Please enter some text or attach a file for your achievement post."
        );
        return;
      }

      setIsPosting(true);
      try {
        const formData = new FormData();
        // Only append text if it exists and is not empty
        if (hasText) {
          formData.append("text", newPostText.trim());
        } else {
          // If no text, provide a default message for file-only posts
          formData.append("text", "Shared an achievement");
        }
        formData.append("category", "student-achievements");
        if (postFile) {
          formData.append("file", postFile);
        }

        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
          console.log(key, value);
        }

        console.log("Sending request to:", `${API_URL}/posts`);
        console.log("FormData contents:");
        for (let pair of formData.entries()) {
          console.log(pair[0] + ": " + pair[1]);
        }

        const res = await fetch(`${API_URL}/posts`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        console.log("Response status:", res.status);
        console.log("Response ok:", res.ok);

        if (res.ok) {
          const response = await res.json();
          const newPost = response.post;
          setPosts((prevPosts) => [newPost, ...prevPosts]);
          setNewPostText("");
          setPostFile(null);
          // Reset file input
          const fileInput = document.getElementById("postFileInput");
          if (fileInput) fileInput.value = "";
        } else {
          const errorData = await res.json();
          console.error("Failed to create post:", res.status, errorData);
          alert(`Failed to create post: ${errorData.error || "Unknown error"}`);
        }
      } catch (err) {
        console.error("Error creating post:", err);
        alert(`Error creating post: ${err.message}`);
      } finally {
        setIsPosting(false);
      }
    },
    [API_URL, token, newPostText, postFile, user]
  );

  // Filter posts based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user?.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user?.lastname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (token) {
      fetchStudentPosts();
    }
  }, [token, fetchStudentPosts]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/auth");
    }
  }, [token, navigate]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".post-menu-container")) {
        setSelectedPostMenu(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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
          <p>Loading Students Achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper students-achievements-wrapper">
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

      {/* MAIN FEED */}
      <main className="dashboard-feed students-achievements-feed">
        <header className="dashboard-topbar students-achievements-header">
          <div className="dashboard-app-title">
            <FaTrophy className="students-icon" />
            Students Achievements
          </div>
          <input
            type="text"
            placeholder="Search student achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dashboard-search students-search"
          />
        </header>

        <div className="dashboard-feed-scroll">
          {/* POST CREATION FORM - Only for Students */}
          {console.log("User for form visibility:", user)}
          {console.log("User role:", user?.role)}
          {user && user.role === "student" ? (
            <div className="dashboard-create-post students-create-post">
              <form onSubmit={handleCreatePost} className="create-post-form">
                <div className="post-form-header">
                  <img
                    src={
                      user.profilePic
                        ? `${BASE_URL}/${user.profilePic}`
                        : "https://via.placeholder.com/40"
                    }
                    alt="Your Profile"
                    className="dashboard-post-avatar"
                  />
                  <div className="post-form-title">
                    <h3>Share Your Achievement</h3>
                    <p>Let the community know about your latest success!</p>
                  </div>
                </div>

                <textarea
                  placeholder="Share your academic achievements, projects, competitions, certifications, or any milestone you're proud of..."
                  value={newPostText}
                  onChange={(e) => {
                    console.log("Text changing to:", e.target.value);
                    setNewPostText(e.target.value);
                  }}
                  className="post-text-input"
                  rows="3"
                />

                <div className="post-form-actions">
                  <div className="file-upload-section">
                    <label htmlFor="postFileInput" className="file-upload-btn">
                      <FaCamera />
                      Add Photo/Document
                    </label>
                    <input
                      type="file"
                      id="postFileInput"
                      onChange={(e) => setPostFile(e.target.files[0])}
                      accept="image/*,application/pdf,.doc,.docx"
                      style={{ display: "none" }}
                    />
                    {postFile && (
                      <span className="selected-file">📎 {postFile.name}</span>
                    )}
                  </div>

                  {console.log("Button state - newPostText:", newPostText)}
                  {console.log("Button state - postFile:", postFile)}
                  {console.log(
                    "Button disabled condition:",
                    ((!newPostText || newPostText.trim().length === 0) &&
                      !postFile) ||
                      isPosting
                  )}
                  <button
                    type="submit"
                    disabled={
                      ((!newPostText || newPostText.trim().length === 0) &&
                        !postFile) ||
                      isPosting
                    }
                    className="post-submit-btn"
                    style={{
                      opacity:
                        ((!newPostText || newPostText.trim().length === 0) &&
                          !postFile) ||
                        isPosting
                          ? 0.5
                          : 1,
                      cursor:
                        ((!newPostText || newPostText.trim().length === 0) &&
                          !postFile) ||
                        isPosting
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isPosting ? "Posting..." : "Share Achievement"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div
              className="no-permission-message"
              style={{
                padding: "20px",
                textAlign: "center",
                background: "#f0f0f0",
                margin: "20px",
                borderRadius: "8px",
              }}
            >
              {!user ? (
                <p className="loading-text">Loading user information...</p>
              ) : user.role !== "student" ? (
                <p>
                  Only students can post achievements. Your role: {user.role}
                </p>
              ) : (
                <p>Unable to load post form.</p>
              )}
            </div>
          )}

          <div className="dashboard-posts-container students-posts-container">
            {loadingPosts ? (
              <div className="posts-loading">
                <div className="loading-spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <p>Loading student achievements...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="no-posts-message">
                <FaTrophy className="no-posts-icon" />
                <h3>No Student Achievements Yet</h3>
                <p>
                  Students haven't shared any achievements yet. Check back
                  later!
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post._id} className="dashboard-post students-post">
                  <div className="dashboard-post-header">
                    <img
                      src={
                        post.user?.profilePic
                          ? `${BASE_URL}/${post.user.profilePic}`
                          : "https://via.placeholder.com/40"
                      }
                      alt="Author"
                      className="dashboard-post-avatar"
                    />
                    <div className="dashboard-post-author-info">
                      <h4 className="dashboard-post-author">
                        {post.user?.firstname} {post.user?.lastname}
                        <span className="student-badge">Student</span>
                      </h4>
                      <span className="dashboard-post-time">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* 3-dots menu */}
                    <div className="post-menu-container">
                      <FaEllipsisV
                        className="dashboard-post-options"
                        onClick={() =>
                          setSelectedPostMenu(
                            selectedPostMenu === post._id ? null : post._id
                          )
                        }
                      />
                      {selectedPostMenu === post._id && (
                        <div className="post-menu-dropdown">
                          {post.user?._id === user?._id && (
                            <button
                              onClick={() => handleDeletePost(post._id)}
                              className="menu-item delete-item"
                            >
                              Delete Post
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPostMenu(null)}
                            className="menu-item"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-post-content">
                    <p>{post.text}</p>
                    {post.file &&
                      (post.file.toLowerCase().endsWith(".pdf") ? (
                        <div className="post-file-container">
                          <a
                            href={`${BASE_URL}/${post.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="post-pdf-link"
                          >
                            <div className="pdf-preview">
                              <span className="pdf-icon">📄</span>
                              <span className="pdf-text">
                                View PDF Document
                              </span>
                            </div>
                          </a>
                        </div>
                      ) : (
                        <img
                          src={`${BASE_URL}/${post.file}`}
                          alt="Post content"
                          className="dashboard-post-image"
                        />
                      ))}
                  </div>

                  <div className="dashboard-post-stats">
                    <span>{post.likesCount || 0} likes</span>
                    <span>{post.commentsCount || 0} comments</span>
                  </div>

                  <div className="dashboard-post-actions">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`dashboard-action-btn ${
                        post.likes?.includes(user?._id) ? "liked" : ""
                      }`}
                    >
                      <FaThumbsUp /> Like
                    </button>
                    <button
                      onClick={() => openCommentsModal(post._id)}
                      className="dashboard-action-btn"
                    >
                      <FaRegComment /> Comment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-comment-modal">
            <div className="dashboard-modal-header">
              <h3>Comments</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="dashboard-modal-close"
              >
                ×
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-comments-list">
                {selectedPostComments.map((comment) => (
                  <div key={comment._id} className="dashboard-comment">
                    <img
                      src={
                        comment.author?.profilePic
                          ? `${BASE_URL}/${comment.author.profilePic}`
                          : "https://via.placeholder.com/30"
                      }
                      alt="Commenter"
                      className="dashboard-comment-avatar"
                    />
                    <div className="dashboard-comment-content">
                      <strong>
                        {comment.author?.firstname} {comment.author?.lastname}
                      </strong>
                      <p>{comment.text}</p>
                      <span className="dashboard-comment-time">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dashboard-add-comment">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="dashboard-comment-input"
                />
                <button
                  onClick={() => handleAddComment(selectedPostId)}
                  className="dashboard-comment-submit"
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsAchievements;
