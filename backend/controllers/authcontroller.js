const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ------------------ HELPER: JWT GENERATOR ------------------
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ------------------ REGISTER ------------------
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, phone, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      phone,
      email,
      password: hashPassword,
      role: role || "student",
      provider: "local",
    });

    const token = generateToken(user);

    res.status(201).json({
      msg: "User Registered Successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ msg: "Invalid input", error: error.message });
    }
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      msg: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ msg: "Server Error", error: error.message });
  }
};

// ------------------ GOOGLE LOGIN/SIGNUP ------------------
// ------------------ GOOGLE LOGIN/SIGNUP ------------------
exports.googleAuth = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ msg: "Invalid Google user data" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Create new user
      user = await User.create({
        firstname: name.split(" ")[0],
        lastname: name.split(" ")[1] || "",
        phone: "",
        email,
        password: "", // no password for google users
        role: "student",
        provider: "google",
        googleId,
      });
    }

    const token = generateToken(user);

    res.json({
      msg: "Google login/signup successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Error with Google login:", error);
    res.status(500).json({ msg: "Google login failed", error: error.message });
  }
};

// ------------------ LINKEDIN LOGIN/SIGNUP ------------------
