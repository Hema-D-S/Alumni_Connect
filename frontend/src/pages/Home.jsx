import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Home.css"; 

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Alumni Connect</div>
        <ul className="nav-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">Events</a></li>
          <li><a href="#">Alumni</a></li>
          <li><a href="#">Research</a></li>
          <li><a href="#">Campus Life</a></li>
          <li><a href="#">Contact</a></li>
          <li>
            <a href="#" className="signin-btn">
              {/* User icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="white"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </a>
          </li>
        </ul>
      </nav>

      {/* Background */}
      <div className="bg-image">
        <div className="border-frame"></div>

        {/* Overlay text */}
        <div className="overlay-text">
          <h1>University of Visvesvaraya College of Engineering</h1>
          <p>First State Autonomous Institute in Karnataka</p>
          <button 
            className="get-started-btn" 
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
