import React, { useEffect, useState } from "react";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token"); // ✅ token saved at login
        if (!token) return;

        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (res.ok) {
          setUser(data.user); // ✅ full user object
        } else {
          console.error("Profile fetch error:", data.msg);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="dashboard-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">AlumniConnect</div>

        <ul className="nav-links">
          <li>
            <a href="/home">Home</a>
          </li>
          <li>
            <a href="/discussion">Discussion</a>
          </li>
          <li>
            <a href="/connections">Connections</a>
          </li>
          <li>
            <a href="/events">Events</a>
          </li>
        </ul>

        {/* Search + Profile */}
        <div className="right-section">
          <input type="text" placeholder="Search..." className="search-bar" />
          <div className="profile-section">
            <a href="/profile" className="profile-link">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </a>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/auth";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="dashboard-content">
        <h1>Welcome {user ? user.firstname : ""}</h1>
        <p>This is the AlumniConnect central hub.</p>
      </div>
    </div>
  );
};

export default Dashboard;
