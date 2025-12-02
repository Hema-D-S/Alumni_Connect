import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";

function Home() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="home-wrapper">
      {/* Navbar */}
      <nav className="home-navbar">
        <div className="home-logo">Alumni Connect</div>

        {/* Mobile Menu Toggle */}
        <button
          className="home-mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <ul
          className={`home-nav-links ${isMobileMenuOpen ? "mobile-open" : ""}`}
        >
          <li>
            <Link to="/auth">Home</Link>
          </li>
          <li>
            <Link to="/auth">Events</Link>
          </li>
          <li>
            <Link to="/auth">Alumni</Link>
          </li>
          <li>
            <Link to="/auth">Research</Link>
          </li>
          <li>
            <Link to="/auth">Campus Life</Link>
          </li>
          <li>
            <Link to="/auth">Contact</Link>
          </li>
          <li>
            <Link to="/auth" className="home-signin-btn">
              {/* User icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </Link>
          </li>
        </ul>

        {/* Mobile Overlay */}
        <div
          className={`home-mobile-overlay ${isMobileMenuOpen ? "active" : ""}`}
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      </nav>

      {/* Background */}
      <div className="home-bg-image">
        <div className="home-border-frame"></div>

        {/* Overlay text */}
        <div className="home-overlay-text">
          <h1>University of Visvesvaraya College of Engineering</h1>
          <p>First State Autonomous Institute in Karnataka</p>
          <button
            className="home-get-started-btn"
            onClick={() => navigate("/auth")}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
