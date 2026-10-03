const Subject = require("../models/Subject");
const Experiment = require("../models/Experiment");

// Create a new experiment (Admin only)
const createExperiment = async (req, res) => {
  try {
    const { experimentNumber, title, description, subject } = req.body;

    // Validate required fields
    if (!experimentNumber || !subject) {
      return res.status(400).json({
        success: false,
        message: "Experiment number and subject are required",
      });
    }

    // Check whether the selected subject exists
    const existingSubject = await Subject.findById(subject);

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Selected subject not found",
      });
    }

    // Check for duplicate experiment number within the same subject
    const existingExperiment = await Experiment.findOne({
      experimentNumber,
      subject,
    });

    if (existingExperiment) {
      return res.status(409).json({
        success: false,
        message: `Experiment ${experimentNumber} already exists for this subject`,
      });
    }

    // Create the experiment
    const experiment = await Experiment.create({
      experimentNumber,
      title,
      description,
      subject,
    });

    res.status(201).json({
      success: true,
      message: "Experiment created successfully",
      experiment,
    });
  } catch (error) {
    console.error("Create Experiment Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An experiment with this number already exists for this subject",
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while creating the experiment",
    });
  }
};

// Get all experiments, optionally filtered by subject
const getExperiments = async (req, res) => {
  try {
    const filter = {};

    // Example: /api/experiments?subject=SUBJECT_ID
    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    const experiments = await Experiment.find(filter)
      .populate("subject", "name code semester")
      .sort({ experimentNumber: 1 });

    res.status(200).json({
      success: true,
      count: experiments.length,
      experiments,
    });
  } catch (error) {
    console.error("Get Experiments Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching experiments",
    });
  }
};

const getExperimentById = async (req, res) => {
  try {
    const experiment = await Experiment.findById(req.params.id).populate(
      "subject",
      "name code",
    );

    if (!experiment) {
      return res.status(404).json({
        success: false,
        message: "Experiment not found",
      });
    }

    res.status(200).json({
      success: true,
      experiment,
    });
  } catch (error) {
    console.error("Get Experiment Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the experiment",
    });
  }
};
const updateExperiment = async (req, res) => {
  try {
    const { experimentNumber, title, description, subject } = req.body;

    // If a subject is being changed, verify that it exists
    if (subject) {
      const existingSubject = await Subject.findById(subject);

      if (!existingSubject) {
        return res.status(404).json({
          success: false,
          message: "Selected subject not found",
        });
      }
    }

    const experiment = await Experiment.findById(req.params.id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        message: "Experiment not found",
      });
    }

    const targetSubject = subject || experiment.subject;
    const targetNumber =
      experimentNumber !== undefined
        ? experimentNumber
        : experiment.experimentNumber;

    const duplicate = await Experiment.exists({
      subject: targetSubject,
      experimentNumber: targetNumber,
      _id: { $ne: experiment._id },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Experiment ${targetNumber} already exists for this subject`,
      });
    }

    if (experimentNumber !== undefined) experiment.experimentNumber = experimentNumber;
    if (title !== undefined) experiment.title = title;
    if (description !== undefined) experiment.description = description;
    if (subject !== undefined) experiment.subject = subject;
    await experiment.save();
    await experiment.populate("subject", "name code");

    res.status(200).json({
      success: true,
      message: "Experiment updated successfully",
      experiment,
    });
  } catch (error) {
    console.error("Update Experiment Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An experiment with this number already exists for this subject",
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the experiment",
    });
  }
};

const deleteExperiment = async (req, res) => {
  try {
    const Document = require("../models/Document");
    const hasDocuments = await Document.exists({ experiment: req.params.id });

    if (hasDocuments) {
      return res.status(409).json({
        success: false,
        message: "This experiment cannot be deleted while students have uploaded documents for it.",
      });
    }

    const experiment = await Experiment.findByIdAndDelete(req.params.id);

    if (!experiment) {
      return res.status(404).json({
        success: false,
        message: "Experiment not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Experiment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Experiment Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the experiment",
    });
  }
};

module.exports = {
  createExperiment,
  getExperiments,
  getExperimentById,
  updateExperiment,
  deleteExperiment,
};
