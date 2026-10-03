const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
    },

    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: [true, "Semester is required"],
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate subject codes
// Code is optional, so only enforce uniqueness when a code was supplied.
subjectSchema.index({ code: 1 }, { unique: true, sparse: true });

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = Subject;
