const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, "Semester number is required"],
      unique: true,
      min: [1, "Semester number must be at least 1"],
    },

    name: {
      type: String,
      required: [true, "Semester name is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Semester", semesterSchema);
