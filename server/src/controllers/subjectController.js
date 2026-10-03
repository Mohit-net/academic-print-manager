const Subject = require("../models/Subject");
const Semester = require("../models/Semester");

// Create a new subject (Admin only)
const createSubject = async (req, res) => {
  try {
    const { name, code, semester } = req.body;

    // Validate required fields
    if (!name || !semester) {
      return res.status(400).json({
        success: false,
        message: "Subject name and semester are required",
      });
    }

    // Check whether the semester exists
    const existingSemester = await Semester.findById(semester);

    if (!existingSemester) {
      return res.status(404).json({
        success: false,
        message: "Selected semester not found",
      });
    }

    // Check for duplicate subject name within the same semester
    const existingSubject = await Subject.findOne({
      name: name.trim(),
      semester,
    });

    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: "A subject with this name already exists in this semester",
      });
    }

    // Create the subject
    const subject = await Subject.create({
      name,
      code,
      semester,
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject,
    });
  } catch (error) {
    console.error("Create Subject Error:", error.message);

    // Handle duplicate subject code
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A subject with this code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while creating the subject",
    });
  }
};

// Get all subjects, optionally filtered by semester
const getSubjects = async (req, res) => {
  try {
    const filter = {};

    // Example: /api/subjects?semester=SEMESTER_ID
    if (req.query.semester) {
      filter.semester = req.query.semester;
    }

    const subjects = await Subject.find(filter)
      .populate("semester", "number name")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error("Get Subjects Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching subjects",
    });
  }
};

// Update a subject (Admin only)
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, semester } = req.body;

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // If semester is being changed, verify that it exists
    if (semester && semester !== subject.semester.toString()) {
      const existingSemester = await Semester.findById(semester);

      if (!existingSemester) {
        return res.status(404).json({
          success: false,
          message: "Selected semester not found",
        });
      }
    }

    // Check for duplicate subject name in the target semester. This must also
    // run when only the semester changes.
    const targetSemester = semester || subject.semester;

    if (
      name !== undefined ||
      (semester !== undefined && semester !== subject.semester.toString())
    ) {
      const existingSubject = await Subject.findOne({
        name: name !== undefined ? name.trim() : subject.name,
        semester: targetSemester,
        _id: { $ne: id },
      });

      if (existingSubject) {
        return res.status(409).json({
          success: false,
          message: "A subject with this name already exists in this semester",
        });
      }
    }

    // Update provided fields
    if (name !== undefined) subject.name = name;
    if (code !== undefined) subject.code = code;
    if (semester !== undefined) subject.semester = semester;

    await subject.save();

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (error) {
    console.error("Update Subject Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A subject with this code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the subject",
    });
  }
};

// Delete a subject (Admin only)
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const Experiment = require("../models/Experiment");
    const hasExperiments = await Experiment.exists({ subject: id });

    if (hasExperiments) {
      return res.status(409).json({
        success: false,
        message: "This subject cannot be deleted while it has experiments.",
      });
    }

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Delete Subject Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the subject",
    });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  updateSubject,
  deleteSubject,
};
