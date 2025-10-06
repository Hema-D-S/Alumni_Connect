import React, { useState } from "react";
import "../styles/Auth.css";
import { FaGoogle, FaLinkedin, FaEye, FaEyeSlash } from "react-icons/fa";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    batch: "",
  });

  const navigate = useNavigate();

  // Use hardcoded local API URL to fix connection issue
  const API = "http://localhost:5000/api";

  // Debug environment on component load
  React.useEffect(() => {
    console.log("Auth component loaded with environment:");
    console.log("API URL:", API);
    console.log("Environment variables:", {
      VITE_USE_PRODUCTION: import.meta.env.VITE_USE_PRODUCTION,
      MODE: import.meta.env.MODE,
      VERCEL: import.meta.env.VERCEL,
    });
  }, [API]);

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

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return false;
    }

    if (isSignUp) {
      if (!formData.firstname.trim()) {
        alert("First name is required");
        return false;
      }
      if (!formData.lastname.trim()) {
        alert("Last name is required");
        return false;
      }
      if (!formData.username.trim()) {
        alert("Username is required");
        return false;
      }
      if (formData.username.length < 3) {
        alert("Username must be at least 3 characters");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match");
        return false;
      }
      if (formData.password.length < 6) {
        alert("Password must be at least 6 characters");
        return false;
      }
      if (!formData.batch || isNaN(formData.batch)) {
        alert("Please enter a valid batch year");
        return false;
      }
      const currentYear = new Date().getFullYear();
      if (formData.batch < 1950 || formData.batch > currentYear + 10) {
        alert("Please enter a realistic batch year");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    console.log("Attempting authentication with API:", API);
    console.log("Form data:", isSignUp ? formData : { email: formData.email });

    setIsLoading(true);
    try {
      let res;

      if (isSignUp) {
        // Signup request
        console.log("Making signup request to:", `${API}/auth/register`);
        res = await axios.post(`${API}/auth/register`, formData, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        });
      } else {
        // Signin request
        console.log("Making signin request to:", `${API}/auth/login`);
        res = await axios.post(
          `${API}/auth/login`,
          {
            email: formData.email,
            password: formData.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: 10000,
          }
        );
      }

      console.log("Authentication successful:", res.data);

      // Validate response data
      if (!res.data.token) {
        throw new Error("No token received from server");
      }
      if (!res.data.user || !res.data.user._id) {
        throw new Error("Invalid user data received from server");
      }

      // Store token + user
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);

      console.log("Redirecting to dashboard");
      navigate("/dashboard");
    } catch (err) {
      console.error("Auth error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
        },
      });

      let errorMessage = "Error occurred while authenticating";

      if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid email or password";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message === "Network Error") {
        errorMessage =
          "Cannot connect to server. Please check your internet connection.";
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      alert("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      console.log(
        "Sending password reset request to:",
        `${API}/auth/forgot-password`
      );

      const response = await axios.post(
        `${API}/auth/forgot-password`,
        {
          email: formData.email,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("Password reset response:", response.data);

      alert(
        `Password reset email sent to ${formData.email}. Please check your inbox and spam folder.`
      );
      setShowForgotPassword(false);
    } catch (err) {
      console.error("Forgot password error:", err);

      let errorMessage = "Error sending reset email. Please try again.";

      if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message === "Network Error") {
        errorMessage =
          "Cannot connect to server. Please check your internet connection.";
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div
        className={`auth-box ${
          isSignUp ? "auth-signup-active" : "auth-signin-active"
        }`}
      >
        {/* ===== Forgot Password Modal ===== */}
        {showForgotPassword && (
          <div className="auth-form-container auth-animate">
            <h2 className="auth-red-text">Reset Password</h2>
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <button
                className="auth-submit-btn"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <p className="auth-toggle-text">
              Remember your password?{" "}
              <span
                className="auth-toggle-link"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </span>
            </p>
          </div>
        )}

        {/* ===== Sign In Form ===== */}
        {!isSignUp && !showForgotPassword && (
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
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p
                className="auth-forgot"
                onClick={() => setShowForgotPassword(true)}
                style={{ cursor: "pointer" }}
              >
                Forgot your password?
              </p>
              <button
                className="auth-submit-btn"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
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
        {isSignUp && !showForgotPassword && (
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
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
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
              <button
                className="auth-submit-btn auth-red-btn"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
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
