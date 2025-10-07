// src/components/LeftSidebar.jsx
import React, { useState, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import "../styles/SidebarCommon.css";
import { getBaseUrl } from "../config/environment";
import ProfileModal from "./ProfileModal";
import { useUser } from "../hooks/useUser";

const LeftSidebar = memo(({ openProfileModal }) => {
  // Use global user context
  const { user, logout: logoutUser, updateUser } = useUser();
  // Use dynamic base URL
  const BASE_URL = getBaseUrl();
  const navigate = useNavigate();
  const [showInternalProfileModal, setShowInternalProfileModal] =
    useState(false);

  const handleLogout = useCallback(() => {
    // Confirm logout
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      // Use context logout function
      logoutUser();
      // Redirect to auth page
      navigate("/auth");
    }
  }, [logoutUser, navigate]);

  const handleProfileClick = useCallback(() => {
    if (openProfileModal && typeof openProfileModal === "function") {
      // Use external profile modal if provided (like in Dashboard)
      openProfileModal(true);
    } else {
      // Use internal profile modal for other pages
      setShowInternalProfileModal(true);
    }
  }, [openProfileModal]);

  return (
    <aside className="dashboard-sidebar sidebar-common">
      <div className="dashboard-profile">
        <img
          src={
            user?.profilePic
              ? `${BASE_URL}/${user.profilePic}` // ✅ Fixed: use BASE_URL instead of API
              : "https://via.placeholder.com/80"
          }
          alt="Profile"
        />
        <h2 className="dashboard-name sidebar-profile-name">
          {user ? user.firstname : "Loading..."}
        </h2>
        <p className="dashboard-username sidebar-profile-username">
          @{user ? user.username : "..."}
        </p>
      </div>

      <nav className="dashboard-menu sidebar-menu">
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
            handleProfileClick();
          }}
          className="profile-action-btn"
        >
          <i className="fas fa-user-circle"></i> My Profile
        </a>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          className="logout-action-btn"
        >
          <i className="fas fa-sign-out-alt"></i> Logout
        </a>
      </div>

      {/* Internal Profile Modal for pages that don't have their own */}
      <ProfileModal
        user={user}
        isOpen={showInternalProfileModal}
        onClose={() => setShowInternalProfileModal(false)}
        onUserUpdate={updateUser}
      />
    </aside>
  );
});

LeftSidebar.displayName = "LeftSidebar";

export default LeftSidebar;
