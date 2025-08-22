import React, { useState } from "react";
import "./Auth.css";
import { FaGoogle, FaLinkedin } from "react-icons/fa";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="auth-container">
      <div className={`auth-box ${isSignUp ? "signup-active" : "signin-active"}`}>
        
        {/* ===== Sign In Form ===== */}
        {!isSignUp && (
          <div className="form-container animate">
            <h2 className="red-text">Sign In</h2>
            <div className="social-login">
              <button className="social-btn google"><FaGoogle size={22} /></button>
              <button className="social-btn linkedin"><FaLinkedin size={22} /></button>
            </div>
            <form>
              <input type="email" placeholder="Email" required />
              <input type="password" placeholder="Password" required />
              <p className="forgot">Forgot your password?</p>
              <button className="submit-btn">Sign In</button>
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
              <button className="social-btn google"><FaGoogle size={22} /></button>
              <button className="social-btn linkedin"><FaLinkedin size={22} /></button>
            </div>
            <form>
              <input type="text" placeholder="First Name" required />
              <input type="text" placeholder="Last Name" required />
              <input type="tel" placeholder="Phone Number" required />
              <input type="email" placeholder="Email" required />
              <input type="password" placeholder="Password" required />
              <button className="submit-btn red-btn">Sign Up</button>
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
