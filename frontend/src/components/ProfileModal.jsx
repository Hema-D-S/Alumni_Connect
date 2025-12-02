// src/components/ProfileModal.jsx
import React, { useState, useEffect } from "react";
import { getApiUrl } from "../config/environment";
import { getProfilePicUrl } from "../utils/imageUtils";
import "../styles/Dashboard.css";
import axios from "axios";

const ProfileModal = ({ user, isOpen, onClose, onUserUpdate }) => {
  const [firstnameInput, setFirstnameInput] = useState("");
  const [lastnameInput, setLastnameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API = getApiUrl();

  useEffect(() => {
    if (user && isOpen) {
      setFirstnameInput(user.firstname || "");
      setLastnameInput(user.lastname || "");
      setUsernameInput(user.username || "");
      setPhoneInput(user.phone || "");
      setProfilePicFile(null);
    }
  }, [user, isOpen]);

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();

      if (firstnameInput.trim()) formData.append("firstname", firstnameInput);
      if (lastnameInput.trim()) formData.append("lastname", lastnameInput);
      if (usernameInput.trim()) formData.append("username", usernameInput);
      if (phoneInput.trim()) formData.append("phone", phoneInput);
      if (profilePicFile) formData.append("profilePic", profilePicFile);

      const response = await axios.put(`${API}/auth/profile`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Profile updated successfully!");

      // Update user data in parent component
      if (onUserUpdate) {
        onUserUpdate(response.data.user);
      }

      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.msg || "Error updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal profile-modal">
        <div className="modal-header">
          <h2>Update Profile</h2>
          <button onClick={onClose} className="modal-close-btn">
            ×
          </button>
        </div>

        <div className="profile-modal-content">
          {/* Profile Picture Section */}
          <div className="profile-pic-section">
            <div className="current-profile-pic">
              <img
                src={getProfilePicUrl(user?.profilePic)}
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
          <button
            onClick={handleUpdateProfile}
            className="save-btn"
            disabled={isLoading}
          >
            <i className="fas fa-save"></i>
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={onClose} className="cancel-btn">
            <i className="fas fa-times"></i> Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
