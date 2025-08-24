import React from "react";
import "../styles/Dashboard.css";
import {
  FaHome,
  FaSearch,
  FaBell,
  FaCommentDots,
  FaUser,
  FaBullhorn,
  FaBriefcase,
  FaCog,
} from "react-icons/fa";

const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="profile">
          <img src="https://via.placeholder.com/80" alt="Profile" />
          <h2 className="name">Alexander Tunisna</h2>
          <p className="username">@tunisna_dev</p>
        </div>

        <nav className="menu">
          <a href="#">
            <i className="fas fa-tachometer-alt"></i> Dashboard
          </a>
          <a href="#">
            <i className="fas fa-search"></i> Find
          </a>
          <a href="#">
            <i className="fas fa-bullhorn"></i> Announcements
          </a>
          <a href="#">
            <i className="fas fa-comments"></i> Chat
          </a>
          <a href="#">
            <i className="fas fa-calendar-alt"></i> Events
          </a>
          <a href="#">
            <i className="fas fa-star"></i> Alumni Highlights
          </a>
          <a href="#">
            <i className="fas fa-award"></i> Students Achievements
          </a>
        </nav>

        {/* My Profile at bottom */}
        <div className="bottom-profile">
          <a href="#">
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
          {/* Add more chats */}
        </div>
      </aside>
    </div>
  );
};

export default Dashboard;
