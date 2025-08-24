import React, { useState } from "react";
import "./Auth.css";
import { FaGoogle, FaLinkedin } from "react-icons/fa";
import { signup, signin } from "../services/api";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    password: "",
  });

  // ---------- Google Login ----------
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const { access_token } = response;
        if (!access_token) throw new Error("No access token from Google");

        // Get user info from Google
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        );

        // Send only required fields (no picture)
        const res = await axios.post("http://localhost:5000/api/auth/google", {
          email: userInfo.data.email,
          name: userInfo.data.name,
          googleId: userInfo.data.sub, // Google unique ID
        });

        localStorage.setItem("token", res.data.token);
        alert("Google Signup/Login successful");
        console.log(res.data.user);
      } catch (err) {
        console.error("Google login error:", err);
        alert("Google login failed");
      }
    },
    onError: () => {
      alert("Google Login Failed");
    },
  });
  // ---------- Form Handling ----------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const data = await signup(formData);
        localStorage.setItem("token", data.token);
        alert("Signup successful");
        console.log(data.user);
      } else {
        const data = await signin({
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("token", data.token);
        alert("Login successful");
        console.log(data.user);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Error occurred");
      console.error(err.response?.data);
    }
  };

  return (
    <div className="auth-container">
      <div
        className={`auth-box ${isSignUp ? "signup-active" : "signin-active"}`}
      >
        {/* ===== Sign In Form ===== */}
        {!isSignUp && (
          <div className="form-container animate">
            <h2 className="red-text">Sign In</h2>
            <div className="social-login">
              <button className="social-btn google" onClick={loginWithGoogle}>
                <FaGoogle size={22} />
              </button>
              <button className="social-btn linkedin">
                <FaLinkedin size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <p className="forgot">Forgot your password?</p>
              <button className="submit-btn" type="submit">
                Sign In
              </button>
            </form>
            <p>
              Don’t have an account?{" "}
              <span className="toggle-link" onClick={() => setIsSignUp(true)}>
                Create one
              </span>
            </p>
          </div>
        )}

        {/* ===== Sign Up Form ===== */}
        {isSignUp && (
          <div className="form-container animate">
            <h2 className="white-text">Create Account</h2>
            <div className="social-login">
              <button className="social-btn google" onClick={loginWithGoogle}>
                <FaGoogle size={22} />
              </button>
              <button className="social-btn linkedin">
                <FaLinkedin size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="firstname"
                placeholder="First Name"
                value={formData.firstname}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastname"
                placeholder="Last Name"
                value={formData.lastname}
                onChange={handleChange}
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button className="submit-btn red-btn" type="submit">
                Sign Up
              </button>
            </form>
            <p>
              Already have an account?{" "}
              <span className="toggle-link" onClick={() => setIsSignUp(false)}>
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
