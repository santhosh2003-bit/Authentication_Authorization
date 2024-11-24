const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/roles");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const user = new User({ username, email, password, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error registering user", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: "Error logging in", error: err.message });
  }
});

// Protected route for Admin
router.get("/admin", authenticate, authorize(["admin"]), (req, res) => {
  res.send("Welcome Admin! You have full access.");
});

// Protected route for Moderator
router.get(
  "/moderator",
  authenticate,
  authorize(["moderator", "admin"]),
  (req, res) => {
    res.send("Welcome Moderator! You have limited access.");
  }
);

// Protected route for User
router.get(
  "/user",
  authenticate,
  authorize(["user", "moderator", "admin"]),
  (req, res) => {
    res.send("Welcome User! You can view content.");
  }
);

module.exports = router;
