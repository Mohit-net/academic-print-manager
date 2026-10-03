const express = require("express");
const {
  createSemester,
  getSemesters,
  updateSemester,
  deleteSemester,
} = require("../controllers/semesterController");

const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// All authenticated users can view semesters
router.get("/", protect, getSemesters);

// Only admins can create semesters
router.post("/", protect, authorize("admin"), createSemester);

// Only admins can update semesters
router.put("/:id", protect, authorize("admin"), validateObjectId(), updateSemester);

// Only admins can delete semesters
router.delete("/:id", protect, authorize("admin"), validateObjectId(), deleteSemester);

module.exports = router;
