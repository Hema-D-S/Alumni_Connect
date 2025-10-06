const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

// ------------------ EMAIL TRANSPORTER ------------------
const createTransporter = () => {
  // Validate email configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "Email configuration missing. Please set EMAIL_USER and EMAIL_PASS in environment variables."
    );
  }

  if (
    process.env.EMAIL_USER.includes("your-") ||
    process.env.EMAIL_PASS.includes("your-")
  ) {
    throw new Error(
      "Please replace placeholder email credentials with actual Gmail credentials in .env file."
    );
  }

  console.log("Creating email transporter with:", {
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASS,
  });

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

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
    console.log("Login attempt from origin:", req.get("origin"));
    console.log("Login request body:", {
      email: req.body.email,
      hasPassword: !!req.body.password,
    });

    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found for email:", email);
      return res.status(400).json({ msg: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password for user:", email);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = generateToken(user);
    console.log("Login successful for user:", email);

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
        profilePic: profilePic || "/uploads/default-profile-black.png",
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
        profilePic: "/uploads/default-profile-black.png",
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

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    // Normalize email (trim whitespace and convert to lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    console.log("Looking for user with email:", normalizedEmail);

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    });

    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res
        .status(404)
        .json({ msg: "No account found with this email address" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before saving to database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token and expiration (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const message = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.firstname || user.username},</p>
      <p>You requested a password reset for your Alumni Connect account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #a30027; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <br>
      <p>Best regards,<br>Alumni Connect Team</p>
    `;

    // Send email
    console.log("Attempting to send email to:", user.email);

    try {
      const transporter = createTransporter();
      console.log("Transporter created successfully");

      // Test the connection first
      console.log("Testing transporter connection...");
      await transporter.verify();
      console.log("Email server connection verified");

      const mailOptions = {
        from: `"Alumni Connect" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset Request - Alumni Connect",
        html: message,
      };

      console.log("Sending email with options:", {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      const emailResult = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", emailResult.messageId);

      res.json({
        msg: "Password reset email sent successfully",
        email: user.email,
      });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      throw new Error(`Email sending failed: ${emailError.message}`);
    }
  } catch (error) {
    console.error("Error in forgot password:", error);

    // Clear reset token if email fails
    if (typeof user !== "undefined" && user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    }

    // Provide more specific error messages
    let errorMessage = "Error sending password reset email";

    if (error.message.includes("Email configuration missing")) {
      errorMessage = "Email service not configured. Please contact support.";
    } else if (error.message.includes("Invalid login")) {
      errorMessage =
        "Email service authentication failed. Please contact support.";
    } else if (error.message.includes("Connection timeout")) {
      errorMessage = "Email service timeout. Please try again later.";
    } else if (error.message.includes("Email sending failed")) {
      errorMessage = error.message;
    }

    res.status(500).json({
      msg: errorMessage,
      error: error.message,
    });
  }
};

// ------------------ RESET PASSWORD ------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ msg: "Password is required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters" });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({
      msg: "Error resetting password",
      error: error.message,
    });
  }
};
