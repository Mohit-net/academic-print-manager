const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // Student who owns this document
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },

    // Experiment this document belongs to
    experiment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experiment",
      required: [true, "Experiment is required"],
    },

    // Original name of the uploaded PDF
    fileName: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
    },

    // Google Drive file ID
    googleDriveFileId: {
      type: String,
      required: [true, "Google Drive file ID is required"],
    },

    // Size of the file in bytes
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },

    // Number of pages in the PDF (extracted at upload time)
    pageCount: {
      type: Number,
      default: 0,
    },

    // Optional submission deadline set by the student at upload time
    submissionDeadline: {
      type: Date,
      default: null,
    },

    // Whether the student has printed this document (drives reminder logic)
    isPrinted: {
      type: Boolean,
      default: false,
    },

    // Reminder sent flag — prevents duplicate reminder notifications
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// A student can have only one active document for each experiment
documentSchema.index({ student: 1, experiment: 1 }, { unique: true });

const Document = mongoose.model("Document", documentSchema);

module.exports = Document;
