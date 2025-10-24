import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getApiUrl } from "../config/environment";
import "../styles/Auth.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(null);

  const { token } = useParams();
  const navigate = useNavigate();
  const API = getApiUrl();

  useEffect(() => {
    // Validate token on component mount
    if (!token) {
      setIsValidToken(false);
      return;
    }

    // For now, assume token is valid. In a real app, you might validate it with the backend
    setIsValidToken(true);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      alert("Password is required");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Resetting password with token:", token);

      const response = await axios.post(
        `${API}/auth/reset-password/${token}`,
        {
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 1000,
        }
      );

      console.log("Password reset successful:", response.data);

      alert(
        "Password reset successful! You can now log in with your new password."
      );
      navigate("/auth");
    } catch (err) {
      console.error("Password reset error:", err);

      let errorMessage = "Error resetting password. Please try again.";

      if (err.response?.data?.msg) {
        errorMessage = err.response.data.msg;
      } else if (err.response?.status === 400) {
        errorMessage =
          "Invalid or expired reset token. Please request a new password reset.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-form-container">
            <h2 className="auth-red-text">Loading...</h2>
            <p>Validating reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-form-container">
            <h2 className="auth-red-text">Invalid Link</h2>
            <p>This password reset link is invalid or has expired.</p>
            <p>Please request a new password reset.</p>
            <button
              className="auth-submit-btn"
              onClick={() => navigate("/auth")}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-form-container">
          <h2 className="auth-red-text">Reset Password</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              className="auth-input"
              type="password"
              placeholder="New Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              className="auth-submit-btn"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
          <p className="auth-toggle-text">
            Remember your password?{" "}
            <span
              className="auth-toggle-link"
              onClick={() => navigate("/auth")}
            >
              Back to Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
