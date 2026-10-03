const mongoose = require("mongoose");

const experimentSchema = new mongoose.Schema(
  {
    experimentNumber: {
      type: Number,
      required: [true, "Experiment number is required"],
      min: [1, "Experiment number must be at least 1"],
    },

    title: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
  },
  {
    timestamps: true,
  },
);

// An experiment number must be unique within the same subject
experimentSchema.index({ subject: 1, experimentNumber: 1 }, { unique: true });

const Experiment = mongoose.model("Experiment", experimentSchema);

module.exports = Experiment;
