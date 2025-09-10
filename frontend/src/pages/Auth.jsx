import React, { useState } from "react";
import "../styles/Auth.css";
import { FaGoogle, FaLinkedin } from "react-icons/fa";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    role: "student",
    batch: "",
  });

  const navigate = useNavigate();

  // Base API URL
  const API = import.meta.env.VITE_API_URL;

  // ---------- Google Login ----------
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const { access_token } = response;
        if (!access_token) throw new Error("No access token from Google");

        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        );

        // Prompt for batch year since it's required
        const batchYear = prompt(
          "Please enter your graduating batch year (e.g., 2023):"
        );

        if (!batchYear || isNaN(batchYear)) {
          alert("Graduating batch year is required and must be a valid number");
          return;
        }

        const res = await axios.post(`${API}/auth/google`, {
          email: userInfo.data.email,
          name: userInfo.data.name,
          googleId: userInfo.data.sub,
          profilePic: userInfo.data.picture,
          batch: parseInt(batchYear),
        });

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.user._id);

        alert("Google Signup/Login successful");
        navigate("/dashboard");
      } catch (err) {
        console.error("Google login error:", err);
        alert("Google login failed");
      }
    },
    onError: () => {
      alert("Google Login Failed");
    },
  });

  const loginWithLinkedIn = () => {
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_LINKEDIN_REDIRECT_URI;
    const state = "randomstring";
    const scope = "r_liteprofile r_emailaddress";

    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
  };

  // ---------- Form Handling ----------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let res;

      if (isSignUp) {
        // Signup request
        res = await axios.post(`${API}/auth/register`, formData);
      } else {
        // Signin request
        res = await axios.post(`${API}/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
      }

      // Store token + user
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);

      navigate("/dashboard");
    } catch (err) {
      console.error("Auth error:", err.response?.data || err.message);
      alert(
        err.response?.data?.msg ||
          err.response?.data?.error ||
          "Error occurred while authenticating"
      );
    }
  };

  return (
    <div className="auth-container">
      <div
        className={`auth-box ${
          isSignUp ? "auth-signup-active" : "auth-signin-active"
        }`}
      >
        {/* ===== Sign In Form ===== */}
        {!isSignUp && (
          <div className="auth-form-container auth-animate">
            <h2 className="auth-red-text">Sign In</h2>
            <div className="auth-social-login">
              <button
                className="auth-social-btn auth-google"
                onClick={loginWithGoogle}
              >
                <FaGoogle size={22} />
              </button>
              <button
                className="auth-social-btn auth-linkedin"
                onClick={loginWithLinkedIn}
              >
                <FaLinkedin size={22} />
              </button>
            </div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <p className="auth-forgot">Forgot your password?</p>
              <button className="auth-submit-btn" type="submit">
                Sign In
              </button>
            </form>
            <p className="auth-toggle-text">
              Don’t have an account?{" "}
              <span
                className="auth-toggle-link"
                onClick={() => setIsSignUp(true)}
              >
                Create one
              </span>
            </p>
          </div>
        )}

        {/* ===== Sign Up Form ===== */}
        {isSignUp && (
          <div className="auth-form-container auth-animate">
            <h2 className="auth-white-text">Create Account</h2>
            <div className="auth-social-login">
              <button
                className="auth-social-btn auth-google"
                onClick={loginWithGoogle}
              >
                <FaGoogle size={22} />
              </button>
              <button
                className="auth-social-btn auth-linkedin"
                onClick={loginWithLinkedIn}
              >
                <FaLinkedin size={22} />
              </button>
            </div>
            <form className="auth-form" onSubmit={handleSubmit}>
              <input
                className="auth-input"
                type="text"
                name="firstname"
                placeholder="First Name"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
              <input
                className="auth-input"
                type="text"
                name="lastname"
                placeholder="Last Name"
                value={formData.lastname}
                onChange={handleChange}
                required
              />
              <input
                className="auth-input"
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <input
                className="auth-input"
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <select
                className="auth-input"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
              </select>
              <input
                className="auth-input"
                type="text"
                name="batch"
                placeholder="Graduating Batch (e.g., 2022)"
                value={formData.batch}
                onChange={handleChange}
                required
              />
              <button className="auth-submit-btn auth-red-btn" type="submit">
                Sign Up
              </button>
            </form>
            <p className="auth-toggle-text">
              Already have an account?{" "}
              <span
                className="auth-toggle-link"
                onClick={() => setIsSignUp(false)}
              >
                Sign In
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
