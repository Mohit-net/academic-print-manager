const express = require("express");
const { logPrint, getMyPrintHistory, getAdminStats } = require("../controllers/printHistoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/print-history — log a new print event
router.post("/", protect, authorize("student"), logPrint);

// GET /api/print-history — get own print history
router.get("/", protect, authorize("student"), getMyPrintHistory);

// GET /api/print-history/admin/stats — admin statistics (admin only)
router.get("/admin/stats", protect, authorize("admin"), getAdminStats);

module.exports = router;
