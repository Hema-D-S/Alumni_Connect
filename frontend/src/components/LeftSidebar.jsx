// src/components/LeftSidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Dashboard.css";
import { getBaseUrl } from "../config/environment";

const LeftSidebar = ({ user, openProfileModal }) => {
  // Use dynamic base URL
  const BASE_URL = getBaseUrl();

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-profile">
        <img
          src={
            user?.profilePic
              ? `${BASE_URL}/${user.profilePic}` // ✅ Fixed: use BASE_URL instead of API
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
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/find">Find</Link>
        <Link to="/chat">Chat</Link>
        <Link to="/mentorshipprograms">Mentorship Programs</Link>
        <Link to="/alumnihighlights">Alumni Highlights</Link>
        <Link to="/studentsachievements">Students Achievements</Link>
      </nav>

      <div className="dashboard-bottom-profile">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            openProfileModal(true);
          }}
        >
          <i className="fas fa-user-circle"></i> My Profile
        </a>
      </div>
    </aside>
  );
};

export default LeftSidebar;
