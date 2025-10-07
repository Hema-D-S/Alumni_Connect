// src/contexts/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getApiUrl } from "../config/environment";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const API = getApiUrl();

  // Decode JWT to get user ID
  const decodeUserIdFromToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      return payload?.id || null;
    } catch (e) {
      console.error("Failed to decode JWT:", e);
      return null;
    }
  }, []);

  // Fetch user data
  const fetchUser = useCallback(async () => {
    try {
      const userId = decodeUserIdFromToken();
      if (!userId) {
        setLoading(false);
        setInitialized(true);
        return;
      }

      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setUser(null);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [API, decodeUserIdFromToken]);

  // Update user data
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setUser(null);
  };

  // Initialize user data on mount
  useEffect(() => {
    if (!initialized) {
      fetchUser();
    }
  }, [initialized, fetchUser]);

  // Listen for storage changes (login/logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        if (e.newValue) {
          // Token added, fetch user
          fetchUser();
        } else {
          // Token removed, clear user
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchUser]);

  const value = {
    user,
    loading,
    initialized,
    updateUser,
    logout,
    refetchUser: fetchUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
