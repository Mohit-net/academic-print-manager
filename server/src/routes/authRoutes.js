const express = require("express");

const {
  loginUser,
  createStudent,
  getStudents,
  updatePreferences,
  updateProfile,
  changePassword,
  saveFcmToken,
  removeFcmToken,
} = require("../controllers/authController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Get currently logged-in user
router.get("/me", protect, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// Update profile (name)
router.patch("/me", protect, updateProfile);

// Change password
router.patch("/me/password", protect, changePassword);

// Update notification preferences
router.patch("/me/preferences", protect, updatePreferences);

// FCM token management
router.post("/me/fcm-token",    protect, saveFcmToken);
router.delete("/me/fcm-token",  protect, removeFcmToken);

// Admin test route
router.get("/admin-test", protect, authorize("admin"), (req, res) => {
  res.status(200).json({ success: true, message: "Welcome Admin!" });
});

// Student management - Admin only
router.get("/students",  protect, authorize("admin"), getStudents);
router.post("/students", protect, authorize("admin"), createStudent);

// Login user
router.post("/login", loginUser);

module.exports = router;
