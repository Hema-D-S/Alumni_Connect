// src/components/LeftSidebar.jsx
import React, { useState, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import "../styles/SidebarCommon.css";
import { getProfilePicUrl } from "../utils/imageUtils";
import ProfileModal from "./ProfileModal";
import { useUser } from "../hooks/useUser";

// Prefetch pages on hover for faster navigation
const prefetchPage = (path) => {
  const routeMap = {
    "/dashboard": () => import("../pages/dashboard.jsx"),
    "/find": () => import("../pages/FindUsers.jsx"),
    "/chat": () => import("../pages/ChatPage.jsx"),
    "/mentorshipprograms": () => import("../pages/MentorshipPrograms.jsx"),
    "/alumnihighlights": () => import("../pages/AlumniHighlights.jsx"),
    "/studentsachievements": () => import("../pages/StudentsAchievements.jsx"),
  };
  
  if (routeMap[path]) {
    routeMap[path]();
  }
};

const LeftSidebar = memo(
  ({ openProfileModal, isMobileOpen, closeMobileMenu }) => {
    // Use global user context
    const { user, logout: logoutUser, updateUser } = useUser();
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
        // Close mobile menu if open
        if (closeMobileMenu) closeMobileMenu();
      }
    }, [logoutUser, navigate, closeMobileMenu]);

    const handleProfileClick = useCallback(() => {
      if (openProfileModal && typeof openProfileModal === "function") {
        // Use external profile modal if provided (like in Dashboard)
        openProfileModal(true);
      } else {
        // Use internal profile modal for other pages
        setShowInternalProfileModal(true);
      }
      // Close mobile menu if open
      if (closeMobileMenu) closeMobileMenu();
    }, [openProfileModal, closeMobileMenu]);

    const handleMenuClick = useCallback(() => {
      // Close mobile menu when a menu item is clicked
      if (closeMobileMenu) closeMobileMenu();
    }, [closeMobileMenu]);

    return (
      <aside
        className={`dashboard-sidebar sidebar-common ${
          isMobileOpen ? "mobile-open" : "mobile-closed"
        }`}
      >
        <div className="dashboard-profile">
          <img src={getProfilePicUrl(user?.profilePic)} alt="Profile" />
          <h2 className="dashboard-name sidebar-profile-name">
            {user ? user.firstname : "Loading..."}
          </h2>
          <p className="dashboard-username sidebar-profile-username">
            @{user ? user.username : "..."}
          </p>
        </div>

        <nav className="dashboard-menu sidebar-menu">
          <Link 
            to="/dashboard" 
            onClick={handleMenuClick}
            onMouseEnter={() => prefetchPage("/dashboard")}
          >
            Dashboard
          </Link>
          <Link 
            to="/find" 
            onClick={handleMenuClick}
            onMouseEnter={() => prefetchPage("/find")}
          >
            Find
          </Link>
          <Link 
            to="/chat" 
            onClick={handleMenuClick}
            onMouseEnter={() => prefetchPage("/chat")}
          >
            Chat
          </Link>
          <Link 
            to="/mentorshipprograms" 
            onClick={handleMenuClick}
            onMouseEnter={() => prefetchPage("/mentorshipprograms")}
          >
            Mentorship Programs
          </Link>
          <Link 
            to="/alumnihighlights" 
            onClick={handleMenuClick}
            onMouseEnter={() => prefetchPage("/alumnihighlights")}
          >
            Alumni Highlights
          </Link>
          <Link 
            to="/studentsachievements" 
            onClick={handleMenuClick}
            onMouseEnter={() => prefetchPage("/studentsachievements")}
          >
            Students Achievements
          </Link>
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
  }
);

LeftSidebar.displayName = "LeftSidebar";

export default LeftSidebar;
