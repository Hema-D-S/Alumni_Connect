import React, { useState, useEffect } from "react";
import LeftSidebar from "../components/LeftSidebar";
import "../styles/MentorshipPrograms.css";

const MentorshipPrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newProgram, setNewProgram] = useState({
    title: "",
    description: "",
    category: "Career Guidance",
    duration: "",
    maxParticipants: 10,
    requirements: "",
    startDate: "",
    endDate: "",
    meetingSchedule: "",
    applicationDeadline: "",
    mode: "online",
    location: "",
    meetingLink: "",
    platform: "zoom",
  });

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";
  const token = localStorage.getItem("token");

  const categories = [
    "All",
    "Career Guidance",
    "Technical Skills",
    "Leadership",
    "Entrepreneurship",
    "Personal Development",
  ];

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setCurrentUser(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    if (token) fetchUser();
  }, [API, token]);

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = `${API}/mentorship`;
        if (selectedCategory !== "All") {
          url = `${API}/mentorship/category/${selectedCategory}`;
        }

        console.log("Fetching programs from:", url); // Debug log
        const res = await fetch(url);
        console.log("Response status:", res.status); // Debug log

        const data = await res.json();
        console.log("Response data:", data); // Debug log

        if (res.ok) {
          setPrograms(data);
        } else {
          setError(data.msg || "Failed to fetch programs");
          console.error("API error:", data);
        }
      } catch (err) {
        setError("Network error: " + err.message);
        console.error("Error fetching programs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [API, selectedCategory]);

  // Create program
  const handleCreateProgram = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/mentorship`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProgram),
      });

      const data = await res.json();
      if (res.ok) {
        setPrograms([data, ...programs]);
        setShowCreateModal(false);
        setNewProgram({
          title: "",
          description: "",
          category: "Career Guidance",
          duration: "",
          maxParticipants: 10,
          requirements: "",
          startDate: "",
          endDate: "",
          meetingSchedule: "",
          applicationDeadline: "",
        });
        alert("Program created successfully!");
      } else {
        alert(data.msg || "Error creating program");
      }
    } catch (err) {
      console.error("Error creating program:", err);
      alert("Error creating program");
    }
  };

  // Apply to program
  const handleApply = async (programId) => {
    try {
      const res = await fetch(`${API}/mentorship/apply/${programId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        alert("Successfully applied to program!");
        // Refresh programs
        const updatedPrograms = programs.map((p) =>
          p._id === programId
            ? { ...p, participants: [...p.participants, currentUser] }
            : p
        );
        setPrograms(updatedPrograms);
      } else {
        alert(data.msg || "Error applying to program");
      }
    } catch (err) {
      console.error("Error applying:", err);
      alert("Error applying to program");
    }
  };

  // Filter programs by search query
  const filteredPrograms = programs.filter(
    (program) =>
      program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      program.mentor.firstname
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      program.mentor.lastname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get profile pic URL
  const getProfilePicUrl = (pic) => {
    if (!pic) return "https://via.placeholder.com/40";
    if (pic.startsWith("http")) return pic;
    return `${BASE_URL}/${pic}`;
  };

  // Check if user has applied to program
  const hasApplied = (program) => {
    return program.participants.some((p) => p._id === currentUser?._id);
  };

  // Check if user is mentor of program
  const isMentor = (program) => {
    return program.mentor._id === currentUser?._id;
  };

  return (
    <div className="mentorship-wrapper">
      <LeftSidebar user={currentUser} openProfileModal={() => {}} />

      <main className="mentorship-main">
        <header className="mentorship-topbar">
          <div className="mentorship-app-title">Mentorship Programs</div>
          <div className="mentorship-search-container">
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {currentUser?.role === "alumni" && (
              <button
                className="mentorship-create-btn"
                onClick={() => setShowCreateModal(true)}
              >
                Create Program
              </button>
            )}
          </div>
        </header>

        {/* Category Filter */}
        <div className="mentorship-categories">
          {categories.map((category) => (
            <button
              key={category}
              className={`mentorship-category-btn ${
                selectedCategory === category ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Programs List */}
        <div className="mentorship-programs">
          {loading ? (
            <div className="mentorship-loading">
              <p>Loading programs...</p>
            </div>
          ) : error ? (
            <div className="mentorship-error">
              <p>Error: {error}</p>
              <button onClick={() => window.location.reload()}>
                Try Again
              </button>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="mentorship-no-programs">
              <p>No programs found in this category.</p>
            </div>
          ) : (
            filteredPrograms.map((program) => (
              <div key={program._id} className="mentorship-program-card">
                <div className="mentorship-program-header">
                  <div className="mentorship-mentor-info">
                    <img
                      src={getProfilePicUrl(program.mentor.profilePic)}
                      alt="Mentor"
                      className="mentorship-mentor-avatar"
                    />
                    <div>
                      <h3>{program.title}</h3>
                      <p>
                        by {program.mentor.firstname} {program.mentor.lastname}
                      </p>
                      <span className="mentorship-category-tag">
                        {program.category}
                      </span>
                    </div>
                  </div>
                  <div className="mentorship-program-meta">
                    <span className="mentorship-duration">
                      {program.duration}
                    </span>
                    <span className="mentorship-participants">
                      {program.participants.length}/{program.maxParticipants}{" "}
                      participants
                    </span>
                  </div>
                </div>

                <div className="mentorship-program-body">
                  <p className="mentorship-description">
                    {program.description}
                  </p>

                  {program.requirements && (
                    <div className="mentorship-requirements">
                      <strong>Requirements:</strong> {program.requirements}
                    </div>
                  )}

                  <div className="mentorship-schedule-info">
                    <div>
                      <strong>Mode:</strong>{" "}
                      <span
                        className={`mentorship-mode-badge ${
                          program.mode || "online"
                        }`}
                      >
                        {program.mode
                          ? program.mode.charAt(0).toUpperCase() +
                            program.mode.slice(1)
                          : "Online"}
                      </span>
                    </div>

                    {program.mode === "offline" && program.location && (
                      <div>
                        <strong>Location:</strong> {program.location}
                      </div>
                    )}

                    {(program.mode === "online" || !program.mode) && (
                      <div>
                        <strong>Platform:</strong>{" "}
                        {program.platform
                          ? program.platform.charAt(0).toUpperCase() +
                            program.platform.slice(1)
                          : "Not specified"}
                        {program.meetingLink && (
                          <a
                            href={program.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mentorship-meeting-link"
                          >
                            🔗 Join Meeting
                          </a>
                        )}
                      </div>
                    )}

                    <div>
                      <strong>Start Date:</strong>{" "}
                      {new Date(program.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>End Date:</strong>{" "}
                      {new Date(program.endDate).toLocaleDateString()}
                    </div>
                    {program.meetingSchedule && (
                      <div>
                        <strong>Schedule:</strong> {program.meetingSchedule}
                      </div>
                    )}
                    {program.applicationDeadline && (
                      <div>
                        <strong>Application Deadline:</strong>{" "}
                        {new Date(
                          program.applicationDeadline
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mentorship-program-footer">
                  {!currentUser ? (
                    <button className="mentorship-apply-btn" disabled>
                      Login to Apply
                    </button>
                  ) : isMentor(program) ? (
                    <button className="mentorship-mentor-badge">
                      Your Program
                    </button>
                  ) : hasApplied(program) ? (
                    <button className="mentorship-applied-btn" disabled>
                      Applied
                    </button>
                  ) : program.participants.length >= program.maxParticipants ? (
                    <button className="mentorship-full-btn" disabled>
                      Program Full
                    </button>
                  ) : (
                    <button
                      className="mentorship-apply-btn"
                      onClick={() => handleApply(program._id)}
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create Program Modal */}
      {showCreateModal && (
        <div className="mentorship-modal-overlay">
          <div className="mentorship-modal">
            <h2>Create Mentorship Program</h2>
            <form onSubmit={handleCreateProgram}>
              <input
                type="text"
                placeholder="Program Title"
                value={newProgram.title}
                onChange={(e) =>
                  setNewProgram({ ...newProgram, title: e.target.value })
                }
                required
              />
              <textarea
                placeholder="Program Description"
                value={newProgram.description}
                onChange={(e) =>
                  setNewProgram({ ...newProgram, description: e.target.value })
                }
                required
              />
              <select
                value={newProgram.category}
                onChange={(e) =>
                  setNewProgram({ ...newProgram, category: e.target.value })
                }
              >
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Duration (e.g., 3 months)"
                value={newProgram.duration}
                onChange={(e) =>
                  setNewProgram({ ...newProgram, duration: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Max Participants"
                value={newProgram.maxParticipants}
                onChange={(e) =>
                  setNewProgram({
                    ...newProgram,
                    maxParticipants: parseInt(e.target.value),
                  })
                }
                min="1"
                max="50"
              />
              <textarea
                placeholder="Requirements (optional)"
                value={newProgram.requirements}
                onChange={(e) =>
                  setNewProgram({ ...newProgram, requirements: e.target.value })
                }
              />
              <input
                type="date"
                placeholder="Start Date"
                value={newProgram.startDate}
                onChange={(e) =>
                  setNewProgram({ ...newProgram, startDate: e.target.value })
                }
                required
              />
              <input
                type="date"
                placeholder="End Date"
                value={newProgram.endDate}
                onChange={(e) =>
                  setNewProgram({ ...newProgram, endDate: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Meeting Schedule (e.g., Weekly on Fridays, 6 PM)"
                value={newProgram.meetingSchedule}
                onChange={(e) =>
                  setNewProgram({
                    ...newProgram,
                    meetingSchedule: e.target.value,
                  })
                }
              />

              {/* Mode Selection */}
              <div className="mentorship-mode-section">
                <label>Program Mode:</label>
                <select
                  value={newProgram.mode}
                  onChange={(e) =>
                    setNewProgram({ ...newProgram, mode: e.target.value })
                  }
                  required
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              {/* Conditional Fields based on mode */}
              {newProgram.mode === "offline" ? (
                <input
                  type="text"
                  placeholder="Location (e.g., Conference Room A, Building B)"
                  value={newProgram.location}
                  onChange={(e) =>
                    setNewProgram({ ...newProgram, location: e.target.value })
                  }
                  required
                />
              ) : (
                <>
                  <select
                    value={newProgram.platform}
                    onChange={(e) =>
                      setNewProgram({ ...newProgram, platform: e.target.value })
                    }
                    required
                  >
                    <option value="zoom">Zoom</option>
                    <option value="gmeet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="url"
                    placeholder="Meeting Link (e.g., https://zoom.us/j/123456789)"
                    value={newProgram.meetingLink}
                    onChange={(e) =>
                      setNewProgram({
                        ...newProgram,
                        meetingLink: e.target.value,
                      })
                    }
                    required
                  />
                </>
              )}

              <input
                type="date"
                placeholder="Application Deadline"
                value={newProgram.applicationDeadline}
                onChange={(e) =>
                  setNewProgram({
                    ...newProgram,
                    applicationDeadline: e.target.value,
                  })
                }
              />
              <div className="mentorship-modal-actions">
                <button type="submit">Create Program</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorshipPrograms;
