import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [firstnameInput, setFirstnameInput] = useState("");

  // Fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
        } else {
          console.error("Profile fetch error:", data.msg);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="dashboard">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="profile">
          <img src="https://via.placeholder.com/80" alt="Profile" />
          <h2 className="name">{user ? user.firstname : "Loading..."}</h2>
          <p className="username">@{user ? user.username : "..."}</p>
        </div>

        <nav className="menu">
          <a href="#">Dashboard</a>
          <a href="#">Find</a>
          <a href="#">Announcements</a>
          <a href="#">Chat</a>
          <a href="#">Events</a>
          <a href="#">Alumni Highlights</a>
          <a href="#">Students Achievements</a>
        </nav>

        <div className="bottom-profile">
          <a href="#" onClick={() => setShowProfileModal(true)}>
            <i className="fas fa-user-circle"></i> My Profile
          </a>
        </div>
      </aside>

      {/* MAIN FEED */}
      <main className="feed">
        <header className="topbar">
          <div className="app-title">Alumni Connect</div>
          <input type="text" placeholder="Search..." />
        </header>

        <div className="feed-scroll">
          {/* Post Creator */}
          <div className="create-post">
            <input type="text" placeholder="Start making your post..." />
            <div className="actions">
              <button>Upload Image</button>
              <button>Upload File</button>
              <button>Upload Video</button>
            </div>
          </div>

          {/* Example Post */}
          <div className="post">
            <div className="post-header">
              <img src="https://via.placeholder.com/40" alt="User" />
              <div>
                <h3>Robert Nowil</h3>
                <p>2 hours ago</p>
              </div>
            </div>
            <p className="post-text">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <img
              src="https://via.placeholder.com/400x200"
              alt="Post"
              className="post-image"
            />
            <div className="post-footer">
              <span>👍 1.4k Likes</span>
              <span>💬 246 Comments</span>
              <span>↪️ Share</span>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="chat">
        <div className="chat-header">Chats</div>
        <div className="chat-scroll">
          <div className="chat-item">
            <img src="https://via.placeholder.com/40" alt="Ariana" />
            <div>
              <p className="chat-name">Ariana Roman</p>
              <p className="chat-msg">Okay, Let’s talk more…</p>
            </div>
          </div>
          <div className="chat-item">
            <img src="https://via.placeholder.com/40" alt="Robert" />
            <div>
              <p className="chat-name">Robert Nowil</p>
              <p className="chat-msg">Not too okay.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Update Profile</h2>
            <input
              type="text"
              value={firstnameInput}
              onChange={(e) => setFirstnameInput(e.target.value)}
              placeholder="First Name"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
