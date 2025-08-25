import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import { FaThumbsUp, FaRegComment, FaEllipsisV } from "react-icons/fa";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [postFile, setPostFile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null); // for 3-dot menu

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

  const token = localStorage.getItem("token");

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      const res = await fetch("http://localhost:5000/api/posts", {
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
      const res = await fetch("http://localhost:5000/api/posts", {
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
        `http://localhost:5000/api/posts/${
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
        `http://localhost:5000/api/posts/comment/${activePost._id}`,
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
        `http://localhost:5000/api/posts/comment/${activePost._id}/${commentId}`,
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
      const res = await fetch("http://localhost:5000/api/auth/profile", {
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

  // Handle post delete
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* LEFT SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-profile">
          <img
            src={
              user?.profilePic
                ? `http://localhost:5000/${user.profilePic}`
                : "https://via.placeholder.com/80"
            }
            alt="Profile"
          />
          <h2 className="dashboard-name">
            {user ? user.firstname : "Loading..."}
          </h2>
          <p className="dashboard-username">@{user ? user.username : "..."}</p>
        </div>

        <nav className="dashboard-menu">
          <a href="#">Dashboard</a>
          <a href="#">Find</a>
          <a href="#">Announcements</a>
          <a href="#">Chat</a>
          <a href="#">Events</a>
          <a href="#">Alumni Highlights</a>
          <a href="#">Students Achievements</a>
        </nav>

        <div className="dashboard-bottom-profile">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setShowProfileModal(true);
            }}
          >
            <i className="fas fa-user-circle"></i> My Profile
          </a>
        </div>
      </aside>

      {/* MAIN FEED */}
      <main className="dashboard-feed">
        <header className="dashboard-topbar">
          <div className="dashboard-app-title">Alumni Connect</div>
          <input type="text" placeholder="Search..." />
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
          {posts.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            posts.map((post) => {
              const isOwner =
                user?._id === post.user?._id || user?.role === "admin";
              return (
                <div key={post._id} className="dashboard-post">
                  <div className="dashboard-post-header">
                    <img
                      src={
                        post.user?.profilePic
                          ? `http://localhost:5000/${post.user.profilePic}`
                          : "https://via.placeholder.com/40"
                      }
                      alt="Profile"
                    />
                    <div>
                      <h3>{post.user?.firstname || "Unknown User"}</h3>
                      <p>{new Date(post.createdAt).toLocaleString()}</p>
                    </div>

                    {/* Vertical 3-dot menu */}
                    {isOwner && (
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
                              onClick={() =>
                                window.alert("Redirect to edit post page")
                              }
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

                  <p className="dashboard-post-text">{post.text}</p>
                  {post.file && (
                    <>
                      {post.file.endsWith(".pdf") ? (
                        <a
                          href={`http://localhost:5000/${post.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="dashboard-post-file"
                        >
                          📄 View PDF
                        </a>
                      ) : (
                        <img
                          src={`http://localhost:5000/${post.file}`}
                          alt="Post"
                          className="dashboard-post-image"
                        />
                      )}
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

      {/* RIGHT SIDEBAR */}
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

      {/* Comments Modal */}
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
