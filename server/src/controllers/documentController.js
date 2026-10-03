const { Readable } = require("stream");

const Document = require("../models/Document");
const Experiment = require("../models/Experiment");
const drive = require("../services/googleDriveService");

// Required at module level so it initialises once at startup, not per-request.
const pdfParse = require("pdf-parse");

// Upload a document
const uploadDocument = async (req, res) => {
  try {
    const { experiment, submissionDeadline } = req.body;

    // Check whether a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    // MIME types are client supplied. Confirm the PDF file signature too.
    if (!req.file.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      return res.status(400).json({
        success: false,
        message: "The uploaded file is not a valid PDF",
      });
    }

    // Validate experiment
    if (!experiment) {
      return res.status(400).json({
        success: false,
        message: "Experiment is required",
      });
    }

    const existingExperiment = await Experiment.findById(experiment);

    if (!existingExperiment) {
      return res.status(404).json({
        success: false,
        message: "Selected experiment not found",
      });
    }

    // Check whether the student already uploaded a document
    const existingDocument = await Document.findOne({
      student: req.user._id,
      experiment,
    });

    if (existingDocument) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a document for this experiment. Delete it before uploading a new one.",
      });
    }

    // Extract page count — run after all validation so a pdf-parse failure
    // never blocks a legitimate upload.
    let pageCount = 0;
    try {
      const parsed = await pdfParse(req.file.buffer);
      pageCount = parsed.numpages || 0;
    } catch {
      pageCount = 0;
    }

    // Convert the uploaded file buffer into a readable stream
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    // Upload the PDF to Google Drive
    const driveResponse = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        mimeType: "application/pdf",
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: "application/pdf",
        body: bufferStream,
      },
      fields: "id, name, webViewLink",
    });

    // Save document information in MongoDB
    let document;
    try {
      document = await Document.create({
        student:    req.user._id,
        experiment,
        fileName:   driveResponse.data.name,
        googleDriveFileId: driveResponse.data.id,
        fileSize:   req.file.size,
        pageCount,
        submissionDeadline: submissionDeadline ? new Date(submissionDeadline) : null,
      });
    } catch (databaseError) {
      // Avoid orphaning a Drive file when the database write fails (for
      // example because a concurrent upload won the unique-index race).
      await drive.files.delete({ fileId: driveResponse.data.id }).catch(() => {});
      throw databaseError;
    }

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document,
    });
  } catch (error) {
    console.error("Upload Document Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already have a document for this experiment.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong while uploading the document",
    });
  }
};

// Get all documents uploaded by the logged-in student
const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({
      student: req.user._id,
    })
      .populate({
        path: "experiment",
        select: "experimentNumber title subject",
        populate: {
          path: "subject",
          select: "name code semester",
          populate: {
            path: "semester",
            select: "number name",
          },
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get My Documents Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching your documents",
    });
  }
};

// View a document uploaded by the logged-in student
const viewDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    // Check if the document exists and belongs to this student
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found or you don't have permission to view it",
      });
    }

    // Get the PDF from Google Drive
    const driveResponse = await drive.files.get(
      {
        fileId: document.googleDriveFileId,
        alt: "media",
      },
      {
        responseType: "stream",
      },
    );

    // Tell the browser that this is a PDF
    res.setHeader("Content-Type", "application/pdf");
    const safeFileName = document.fileName.replace(/[\\r\\n\\"]/g, "_");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeFileName}"`,
    );

    // Stream the PDF directly to the browser
    driveResponse.data.pipe(res);
  } catch (error) {
    console.error("View Document Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while viewing the document",
    });
  }
};

// Delete a document uploaded by the logged-in student
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      student: req.user._id,
    });

    // Check if the document exists and belongs to this student
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found or you don't have permission to delete it",
      });
    }

    // Delete the PDF from Google Drive
    await drive.files.delete({
      fileId: document.googleDriveFileId,
    });

    // Delete the document record from MongoDB
    await Document.findByIdAndDelete(document._id);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete Document Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the document",
    });
  }
};

module.exports = {
  uploadDocument,
  getMyDocuments,
  viewDocument,
  deleteDocument,
};
