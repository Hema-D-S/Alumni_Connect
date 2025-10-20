import React, { useEffect, useState, useCallback } from "react";
import "../styles/Dashboard.css";
import "../styles/AlumniHighlights.css";
import {
  FaThumbsUp,
  FaRegComment,
  FaEllipsisV,
  FaGraduationCap,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";
import { getApiUrl, getBaseUrl } from "../config/environment";
import { useUser } from "../hooks/useUser";

const AlumniHighlights = () => {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("token");
  const BASE_URL = getBaseUrl();
  const API_URL = getApiUrl();
  const navigate = useNavigate();

  // Fetch alumni posts only
  const fetchAlumniPosts = useCallback(async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch(
        `${API_URL}/posts?category=alumni-highlights&limit=20&sort=-createdAt`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setPosts(data.posts || []);
        console.log("Alumni posts loaded:", data.posts?.length || 0);
      } else {
        console.error("Alumni posts fetch failed:", data.msg);
      }
    } catch (err) {
      console.error("Error fetching alumni posts:", err);
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

  // Create a new post (only for alumni)
  const handleCreatePost = useCallback(async () => {
    console.log("AlumniHighlights - handleCreatePost called");
    console.log("Post text:", newPostText);
    console.log("Post file:", postFile);
    console.log("User role:", user?.role);

    // Validate input - require either text OR file
    const hasText = newPostText && newPostText.trim().length > 0;
    const hasFile = postFile !== null;

    if (!hasText && !hasFile) {
      alert("Please enter some text or attach a file for your highlight post.");
      return;
    }

    if (user?.role !== "alumni") {
      alert("Only alumni can post highlights.");
      return;
    }

    try {
      setIsPosting(true);
      const formData = new FormData();
      // Only append text if it exists and is not empty
      if (hasText) {
        formData.append("text", newPostText.trim());
      } else {
        // If no text, provide a default message for file-only posts
        formData.append("text", "Shared a highlight");
      }
      formData.append("category", "alumni-highlights");
      if (postFile) {
        formData.append("file", postFile);
      }

      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        // Add new post to the top of the list
        setPosts((prevPosts) => [data.post, ...prevPosts]);
        setNewPostText("");
        setPostFile(null);
        // Reset file input
        const fileInput = document.getElementById("post-file-input");
        if (fileInput) fileInput.value = "";
      } else {
        console.error("Post creation failed:", data.msg);
      }
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setIsPosting(false);
    }
  }, [API_URL, token, newPostText, postFile, user?.role]);

  // Filter posts based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user?.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user?.lastname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (token) {
      fetchAlumniPosts();
    }
  }, [token, fetchAlumniPosts]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token) {
      navigate("/auth");
    }
  }, [token, navigate]);

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
          <p>Loading Alumni Highlights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper alumni-highlights-wrapper">
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
      <main className="dashboard-feed alumni-highlights-feed">
        <header className="dashboard-topbar alumni-highlights-header">
          <div className="dashboard-app-title">
            <FaGraduationCap className="alumni-icon" />
            Alumni Highlights
          </div>
          <input
            type="text"
            placeholder="Search alumni posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dashboard-search alumni-search"
          />
        </header>

        <div className="dashboard-feed-scroll">
          {/* POST CREATION FORM - Only for Alumni */}
          {user?.role === "alumni" && (
            <div className="dashboard-create-post">
              <div className="dashboard-create-post-header">
                <img
                  src={
                    user?.profilePic
                      ? `${BASE_URL}/${user.profilePic}`
                      : "https://via.placeholder.com/40"
                  }
                  alt="Your profile"
                  className="dashboard-create-post-avatar"
                />
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="Share your alumni highlights with the community..."
                  className="dashboard-create-post-input"
                  rows="3"
                />
              </div>
              <div className="dashboard-create-post-actions">
                <input
                  type="file"
                  id="post-file-input"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => setPostFile(e.target.files[0])}
                  style={{ display: "none" }}
                />
                <label htmlFor="post-file-input" className="dashboard-file-btn">
                  📎 Attach File
                </label>
                {postFile && (
                  <span className="selected-file">
                    {postFile.name}
                    <button
                      onClick={() => {
                        setPostFile(null);
                        document.getElementById("post-file-input").value = "";
                      }}
                      className="remove-file-btn"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostText.trim() || isPosting}
                  className="dashboard-post-btn"
                >
                  {isPosting ? "Posting..." : "Share Highlight"}
                </button>
              </div>
            </div>
          )}

          <div className="dashboard-posts-container alumni-posts-container">
            {loadingPosts ? (
              <div className="posts-loading">
                <div className="loading-spinner">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <p>Loading alumni posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="no-posts-message">
                <FaGraduationCap className="no-posts-icon" />
                <h3>No Alumni Posts Yet</h3>
                <p>
                  Alumni haven't shared any highlights yet. Check back later!
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div key={post._id} className="dashboard-post alumni-post">
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
                        <span className="alumni-badge">Alumni</span>
                      </h4>
                      <span className="dashboard-post-time">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <FaEllipsisV className="dashboard-post-options" />
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

export default AlumniHighlights;
