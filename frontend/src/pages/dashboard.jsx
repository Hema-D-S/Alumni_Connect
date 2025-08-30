import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import { FaThumbsUp, FaRegComment, FaEllipsisV } from "react-icons/fa";
import { Link } from "react-router-dom";
import LeftSidebar from "../components/LeftSidebar";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [postFile, setPostFile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Comments modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [newComment, setNewComment] = useState("");

  // Profile states
  const [firstnameInput, setFirstnameInput] = useState("");
  const [lastnameInput, setLastnameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);

  // Edit post states
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingFile, setEditingFile] = useState(null);
  const [editingFilePreview, setEditingFilePreview] = useState(null);

  // For Search
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");

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

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPosts(data.posts || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostText && !postFile) return;
    const formData = new FormData();
    formData.append("text", newPostText);
    if (postFile) formData.append("file", postFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        setNewPostText("");
        setPostFile(null);
        fetchPosts();
      }
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  // Like / Unlike
  const handleLike = async (postId, liked) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${
          liked ? "unlike" : "like"
        }/${postId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  // Open comments modal
  const openCommentsModal = (post) => {
    setActivePost(post);
    setShowCommentsModal(true);
    setNewComment("");
  };

  // Add Comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !activePost) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/comment/${activePost._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: newComment }),
        }
      );
      if (res.ok) {
        setNewComment("");
        fetchPosts();
        const updated = posts.find((p) => p._id === activePost._id);
        setActivePost(updated);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!activePost) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/comment/${
          activePost._id
        }/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        fetchPosts();
        setActivePost((prev) => ({
          ...prev,
          comments: prev.comments.filter((c) => c._id !== commentId),
        }));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
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

  // Save Post
  const handleSavePost = async (postId) => {
    const formData = new FormData();
    formData.append("text", editingText);
    if (editingFile) formData.append("file", editingFile);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (res.ok) {
        setEditingPostId(null);
        setEditingText("");
        setEditingFile(null);
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to update post");
      }
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Error updating post");
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/${postId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postId)
        );
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete post");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Error deleting post");
    }
  };

  // Filter posts by full name search
  const filteredPosts = posts.filter((post) => {
    const fullName = `${post.user?.firstname || ""} ${
      post.user?.lastname || ""
    }`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="dashboard-wrapper">
      <LeftSidebar
        user={user}
        openProfileModal={() => setShowProfileModal(true)}
      />
      <main className="dashboard-feed">
        <header className="dashboard-topbar">
          <div className="dashboard-app-title">Alumni Connect</div>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        <div className="dashboard-feed-scroll">
          {/* Post Creator */}
          <div className="dashboard-create-post">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Start making your post..."
            />
            <input
              type="file"
              onChange={(e) => setPostFile(e.target.files[0])}
            />
            <div className="dashboard-actions">
              <button onClick={handleCreatePost}>Post</button>
            </div>
          </div>

          {/* Posts */}
          {filteredPosts.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            filteredPosts.map((post) => {
              const isOwner =
                user?._id === post.user?._id || user?.role === "admin";
              const isEditing = editingPostId === post._id;

              return (
                <div key={post._id} className="dashboard-post">
                  <div className="dashboard-post-header">
                    <img
                      src={
                        post.user?.profilePic
                          ? `${import.meta.env.VITE_API_URL}/${
                              post.user.profilePic
                            }`
                          : "https://via.placeholder.com/40"
                      }
                      alt="Profile"
                    />
                    <div>
                      <h3>{post.user?.firstname || "Unknown User"}</h3>
                      <p>{new Date(post.createdAt).toLocaleString()}</p>
                    </div>

                    {isOwner && !isEditing && (
                      <div className="post-menu-container">
                        <FaEllipsisV
                          className="post-menu-icon"
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === post._id ? null : post._id
                            )
                          }
                        />
                        {menuOpenId === post._id && (
                          <div className="post-menu-dropdown">
                            <button
                              onClick={() => {
                                setEditingPostId(post._id);
                                setEditingText(post.text);
                                setEditingFile(null);
                                setMenuOpenId(null);
                              }}
                            >
                              Edit
                            </button>
                            <button onClick={() => handleDeletePost(post._id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="dashboard-edit-post">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="dashboard-edit-textarea"
                      />
                      <input
                        type="file"
                        onChange={(e) => {
                          setEditingFile(e.target.files[0]);
                          if (e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = (ev) =>
                              setEditingFilePreview(ev.target.result);
                            reader.readAsDataURL(e.target.files[0]);
                          } else setEditingFilePreview(null);
                        }}
                      />
                      {editingFilePreview && (
                        <div className="dashboard-edit-preview">
                          {editingFile?.name?.endsWith(".pdf") ? (
                            <a
                              href={editingFilePreview}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              📄 Preview PDF
                            </a>
                          ) : (
                            <img
                              src={editingFilePreview}
                              alt="Preview"
                              className="dashboard-edit-image-preview"
                            />
                          )}
                        </div>
                      )}
                      <div className="dashboard-actions">
                        <button onClick={() => handleSavePost(post._id)}>
                          Save
                        </button>
                        <button onClick={() => setEditingPostId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="dashboard-post-text">{post.text}</p>
                      {post.file &&
                        (post.file.endsWith(".pdf") ? (
                          <a
                            href={`${import.meta.env.VITE_API_URL}/${
                              post.file
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dashboard-post-file"
                          >
                            📄 View PDF
                          </a>
                        ) : (
                          <img
                            src={`${import.meta.env.VITE_API_URL}/${post.file}`}
                            alt="Post"
                            className="dashboard-post-image"
                          />
                        ))}
                    </>
                  )}

                  <div className="dashboard-post-footer">
                    <span
                      onClick={() =>
                        handleLike(post._id, post.likes?.includes(user?._id))
                      }
                      style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <FaThumbsUp /> {post.likes?.length || 0}
                    </span>
                    <span
                      onClick={() => openCommentsModal(post)}
                      style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        marginLeft: "15px",
                      }}
                    >
                      <FaRegComment /> {post.comments?.length || 0}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <aside className="dashboard-chat">
        <div className="dashboard-chat-header">Chats</div>
        <div className="dashboard-chat-scroll">
          <div className="dashboard-chat-item">
            <img src="https://via.placeholder.com/40" alt="Ariana" />
            <div>
              <p className="dashboard-chat-name">Ariana Roman</p>
              <p className="dashboard-chat-msg">Okay, Let’s talk more…</p>
            </div>
          </div>
          <div className="dashboard-chat-item">
            <img src="https://via.placeholder.com/40" alt="Robert" />
            <div>
              <p className="dashboard-chat-name">Robert Nowil</p>
              <p className="dashboard-chat-msg">Not too okay.</p>
            </div>
          </div>
        </div>
      </aside>

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

      {showCommentsModal && activePost && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <h2>Comments</h2>
            <p>{activePost.text}</p>
            <div className="comments-list">
              {activePost.comments?.length > 0 ? (
                activePost.comments.map((c) => (
                  <div key={c._id} className="dashboard-comment">
                    <strong>{c.user?.firstname || "Anon"}:</strong> {c.text}
                    {c.user?._id === user?._id && (
                      <button onClick={() => handleDeleteComment(c._id)}>
                        ❌
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No comments yet</p>
              )}
            </div>
            <div className="dashboard-add-comment">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
              />
              <button onClick={handleAddComment}>Send</button>
            </div>
            <div className="dashboard-modal-actions">
              <button onClick={() => setShowCommentsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
