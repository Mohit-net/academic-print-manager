const express = require("express");

const {
  uploadDocument,
  getMyDocuments,
  viewDocument,
  deleteDocument,
} = require("../controllers/documentController");

const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Upload a document - Students only
router.post(
  "/",
  protect,
  authorize("student"),
  upload.single("file"),
  uploadDocument,
);

// Get all documents uploaded by the logged-in student
router.get("/", protect, authorize("student"), getMyDocuments);

// View a document - Student can view only their own document
router.get("/:id", protect, authorize("student"), validateObjectId(), viewDocument);

// Delete a document - Student can delete only their own document
router.delete("/:id", protect, authorize("student"), validateObjectId(), deleteDocument);

module.exports = router;
