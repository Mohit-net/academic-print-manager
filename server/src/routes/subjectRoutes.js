const express = require("express");

const {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");

const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// All authenticated users can view subjects
router.get("/", protect, getSubjects);

// Only admins can create subjects
router.post("/", protect, authorize("admin"), createSubject);

// Only admins can update subjects
router.put("/:id", protect, authorize("admin"), validateObjectId(), updateSubject);

// Only admins can delete subjects
router.delete("/:id", protect, authorize("admin"), validateObjectId(), deleteSubject);

module.exports = router;
