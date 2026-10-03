const express = require("express");

const {
  createExperiment,
  getExperiments,
  getExperimentById,
  updateExperiment,
  deleteExperiment,
} = require("../controllers/experimentController");

const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

// All authenticated users can view experiments
router.get("/", protect, getExperiments);

// All authenticated users can view a specific experiment by ID
router.get("/:id", protect, validateObjectId(), getExperimentById);

// Only admins can create experiments
router.post("/", protect, authorize("admin"), createExperiment);

// Only admins can update experiments
router.put("/:id", protect, authorize("admin"), validateObjectId(), updateExperiment);

// Only admins can delete experiments
router.delete("/:id", protect, authorize("admin"), validateObjectId(), deleteExperiment);

module.exports = router;
