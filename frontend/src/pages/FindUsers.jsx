import React, { useEffect, useState } from "react";
import axios from "axios";
import LeftSidebar from "../components/LeftSidebar";
import "../styles/FindUsers.css";

const FindUsers = () => {
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Profile modal states (like Dashboard)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [firstnameInput, setFirstnameInput] = useState("");
  const [lastnameInput, setLastnameInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    // Fetch all users for Find
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/findusers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.users);
        setSuggested(res.data.users.slice(0, 3));
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };

    // Fetch logged-in user's profile
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };

    fetchUsers();
    fetchProfile();
  }, [token]);

  const handleConnect = (userId) => {
    setConnected((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleOpenUserProfile = async (user) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/posts/user/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserPosts(res.data.posts);
      setSelectedUser(user);
    } catch (err) {
      console.error("Error fetching user posts", err);
    }
  };

  const handleUpdateProfile = async () => {
    const formData = new FormData();
    formData.append("firstname", firstnameInput);
    formData.append("lastname", lastnameInput);
    formData.append("username", usernameInput);
    formData.append("phone", phoneInput);
    if (profilePicFile) formData.append("profilePic", profilePicFile);

    try {
      const res = await axios.put(
        "http://localhost:5000/api/auth/profile",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data.user);
      setShowProfileModal(false);
    } catch (err) {
      console.error("Error updating profile", err);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstname} ${u.lastname}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="findusers-wrapper">
      {/* LEFT SIDEBAR */}
      <LeftSidebar
        user={user}
        openProfileModal={() => {
          setFirstnameInput(user?.firstname || "");
          setLastnameInput(user?.lastname || "");
          setUsernameInput(user?.username || "");
          setPhoneInput(user?.phone || "");
          setShowProfileModal(true);
        }}
      />

      {/* MAIN CONTENT */}
      <main className="findusers-main">
        <header className="findusers-topbar">
          <div className="findusers-app-title">Connect with People</div>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </header>

        <div className="findusers-list">
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              className={`findusers-card ${
                connected[u._id] ? "connected-card" : ""
              }`}
              onClick={() => handleOpenUserProfile(u)}
            >
              <img
                src={
                  u.profilePic
                    ? `http://localhost:5000/${u.profilePic}`
                    : "https://via.placeholder.com/100"
                }
                alt="Profile"
                className="findusers-avatar"
              />
              <h3>
                {u.firstname} {u.lastname}
              </h3>
              <p>Batch: {u.graduatingBatch || "N/A"}</p>
              <p>Role: {u.role}</p>
              <button
                className={`findusers-connect-btn ${
                  connected[u._id] ? "connected" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnect(u._id);
                }}
              >
                {connected[u._id] ? "Connected" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="findusers-rightbar">
        <h3>Suggested People</h3>
        {suggested.map((u) => (
          <div key={u._id} className="findusers-suggested-card">
            <img
              src={
                u.profilePic
                  ? `http://localhost:5000/${u.profilePic}`
                  : "https://via.placeholder.com/50"
              }
              alt="Profile"
              className="findusers-suggested-avatar"
            />
            <div>
              <p>
                {u.firstname} {u.lastname}
              </p>
              <span>{u.role}</span>
            </div>
          </div>
        ))}
      </aside>

      {/* USER PROFILE MODAL */}
      {selectedUser && (
        <div className="findusers-modal-overlay">
          <div className="findusers-modal">
            <span
              className="findusers-close"
              onClick={() => setSelectedUser(null)}
            >
              &times;
            </span>
            <h2>
              {selectedUser.firstname} {selectedUser.lastname}’s Profile
            </h2>
            <p>
              <strong>Connections:</strong> 12 (mocked)
            </p>
            <h3>Posts</h3>
            <div className="findusers-posts">
              {userPosts.length === 0 ? (
                <p>No posts</p>
              ) : (
                userPosts.map((post) => (
                  <div key={post._id} className="findusers-post">
                    <p>{post.text}</p>
                    {post.file &&
                      (post.file.endsWith(".pdf") ? (
                        <a
                          href={`http://localhost:5000/${post.file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📄 View PDF
                        </a>
                      ) : (
                        <img
                          src={`http://localhost:5000/${post.file}`}
                          alt="Post"
                        />
                      ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PROFILE MODAL (Dashboard style) */}
      {showProfileModal && user && (
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
    </div>
  );
};

export default FindUsers;
