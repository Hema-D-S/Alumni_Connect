const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ------------------ HELPER: JWT GENERATOR ------------------
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ------------------ HELPER: Determine Role by Batch ------------------
const determineRole = (batch) => {
  const currentYear = new Date().getFullYear();
  return batch < currentYear ? "alumni" : "student";
};

// ------------------ REGISTER ------------------
exports.register = async (req, res) => {
  try {
    const { firstname, lastname, username, phone, email, password, batch } =
      req.body;

    if (!batch || isNaN(batch)) {
      return res
        .status(400)
        .json({ msg: "Graduating batch is required and must be a number" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ msg: "Email or Username already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname,
      lastname,
      username,
      phone,
      email,
      password: hashPassword,
      batch,
      role: determineRole(batch),
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
exports.googleAuth = async (req, res) => {
  try {
    const { email, name, googleId, profilePic, batch } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ msg: "Invalid Google user data" });
    }

    if (!batch || isNaN(batch)) {
      return res
        .status(400)
        .json({ msg: "Graduating batch is required and must be a number" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstname: name.split(" ")[0],
        lastname: name.split(" ")[1] || "",
        username: email.split("@")[0],
        email,
        password: "",
        batch,
        role: determineRole(batch),
        provider: "google",
        googleId,
        profilePic: profilePic || "",
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
exports.linkedinAuth = async (req, res) => {
  try {
    const { code, batch } = req.body;

    if (!code) return res.status(400).json({ msg: "No authorization code" });
    if (!batch || isNaN(batch)) {
      return res
        .status(400)
        .json({ msg: "Graduating batch is required and must be a number" });
    }

    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    const profileRes = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const emailRes = await axios.get(
      "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const firstname = profileRes.data.localizedFirstName;
    const lastname = profileRes.data.localizedLastName;
    const email = emailRes.data.elements[0]["handle~"].emailAddress;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstname,
        lastname,
        username: email.split("@")[0],
        email,
        password: "",
        batch,
        role: determineRole(batch),
        provider: "linkedin",
        profilePic: "",
      });
    }

    const token = generateToken(user);

    res.json({
      msg: "LinkedIn login/signup successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Error with LinkedIn login:", error.response?.data || error);
    res.status(500).json({ msg: "LinkedIn login failed" });
  }
};

// ------------------ GET PROFILE ------------------
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ user });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// ------------------ UPDATE PROFILE ------------------
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Extract values from req.body
    const { firstname, lastname, username, phone, batch } = req.body;

    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (username) user.username = username;
    if (phone) user.phone = phone;

    if (batch && !isNaN(batch)) {
      user.batch = batch;
      user.role = determineRole(batch);
    }

    if (req.file) {
      user.profilePic = `uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({ user });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ msg: "Server error" });
  }
};
