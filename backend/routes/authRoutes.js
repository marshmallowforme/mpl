const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model"); // Ensure correct model path
const { protect } = require("../middleware/authMiddleware"); // Middleware for protected routes
const router = express.Router();

// ✅ Signup (Register a new user)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, university, location } = req.body;

    // Check if all fields are provided
    if (!name || !email || !password || !university || !location?.pinCode) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists. Please login." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      university,
      location: {
        formatted: location.formatted,
        pinCode: location.pinCode,
      },
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { id: newUser._id, name: newUser.name, email, university, location },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// ✅ Login User (Updated)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Compare hashed password with entered password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Ensure JWT secret is available
    if (!process.env.JWT_SECRET) {
      console.error("JWT Secret is missing in environment variables.");
      return res.status(500).json({ success: false, message: "Server error. Try again later." });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        university: user.university,
        location: user.location,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// ✅ Get Logged-in User (Protected Route)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// ✅ Get All Users (Temporary Debugging Route)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// ✅ Test Route to Check if API Works
router.get("/", (req, res) => {
  res.json({ success: true, message: "Auth routes working!" });
});

module.exports = router;
