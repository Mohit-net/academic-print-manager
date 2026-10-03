const Semester = require("../models/Semester");

// Create a new semester (Admin only)
const createSemester = async (req, res) => {
  try {
    const { number, name } = req.body;

    // Validate required fields
    if (!number || !name) {
      return res.status(400).json({
        success: false,
        message: "Semester number and name are required",
      });
    }

    // Check if semester number already exists
    const existingSemester = await Semester.findOne({ number });

    if (existingSemester) {
      return res.status(409).json({
        success: false,
        message: `Semester ${number} already exists`,
      });
    }

    // Create semester
    const semester = await Semester.create({
      number,
      name,
    });

    res.status(201).json({
      success: true,
      message: "Semester created successfully",
      semester,
    });
  } catch (error) {
    console.error("Create Semester Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while creating the semester",
    });
  }
};

// Get all semesters (All authenticated users)
const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ number: 1 });

    res.status(200).json({
      success: true,
      count: semesters.length,
      semesters,
    });
  } catch (error) {
    console.error("Get Semesters Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching semesters",
    });
  }
};

// Update a semester (Admin only)
const updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const { number, name } = req.body;

    const semester = await Semester.findById(id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    // Check if another semester already has this number
    if (number && number !== semester.number) {
      const existingSemester = await Semester.findOne({ number });

      if (existingSemester) {
        return res.status(409).json({
          success: false,
          message: `Semester ${number} already exists`,
        });
      }
    }

    // Update only the fields provided
    if (number !== undefined) semester.number = number;
    if (name !== undefined) semester.name = name;

    await semester.save();

    res.status(200).json({
      success: true,
      message: "Semester updated successfully",
      semester,
    });
  } catch (error) {
    console.error("Update Semester Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the semester",
    });
  }
};

// Delete a semester (Admin only)
const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;

    const Subject = require("../models/Subject");
    const hasSubjects = await Subject.exists({ semester: id });

    if (hasSubjects) {
      return res.status(409).json({
        success: false,
        message: "This semester cannot be deleted while it has subjects.",
      });
    }

    const semester = await Semester.findByIdAndDelete(id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Semester deleted successfully",
    });
  } catch (error) {
    console.error("Delete Semester Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the semester",
    });
  }
};

module.exports = {
  createSemester,
  getSemesters,
  updateSemester,
  deleteSemester,
};
