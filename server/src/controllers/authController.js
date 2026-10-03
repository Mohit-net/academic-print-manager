const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user and explicitly include password
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    // Check user and password
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user information (never return password)
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while logging in",
    });
  }
};

// Create a new student - Admin only
const createStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Create student - role is fixed for security
    const student = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "student",
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
    });
  } catch (error) {
    console.error("Create Student Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while creating the student",
    });
  }
};

// Get all students - Admin only
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get Students Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching students",
    });
  }
};

// Update notification preferences
const updatePreferences = async (req, res) => {
  try {
    const { browserNotifications } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      "notificationPreferences.browserNotifications": browserNotifications,
    });
    res.status(200).json({ success: true, message: "Preferences updated" });
  } catch (error) {
    console.error("Update Preferences Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update preferences" });
  }
};

// Update display name
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true }
    ).select("-password");
    res.status(200).json({ success: true, message: "Profile updated", user: updated });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save(); // triggers pre-save hash

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

// Save or refresh an FCM token for the logged-in user (one token per device,
// stored in the fcmTokens array — duplicates are ignored by $addToSet)
const saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "token is required" });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { fcmTokens: token },
    });
    res.status(200).json({ success: true, message: "FCM token saved" });
  } catch (error) {
    console.error("Save FCM Token Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to save FCM token" });
  }
};

// Remove a specific FCM token (called on logout so stale tokens don't pile up)
const removeFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "token is required" });
    }
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { fcmTokens: token },
    });
    res.status(200).json({ success: true, message: "FCM token removed" });
  } catch (error) {
    console.error("Remove FCM Token Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to remove FCM token" });
  }
};

module.exports = {
  loginUser,
  createStudent,
  getStudents,
  updatePreferences,
  updateProfile,
  changePassword,
  saveFcmToken,
  removeFcmToken,
};
