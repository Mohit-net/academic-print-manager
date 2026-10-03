const mongoose = require("mongoose");

const printHistorySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    experiment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Experiment",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
      required: true,
    },
    pageCount: {
      type: Number,
      required: true,
      default: 0,
    },
    printedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["queued", "printed", "cancelled"],
      default: "printed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrintHistory", printHistorySchema);
