const PrintHistory = require("../models/PrintHistory");
const Document = require("../models/Document");

// POST /api/print-history
// Body: { documentId }
const logPrint = async (req, res) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "documentId is required",
      });
    }

    // Verify ownership and populate hierarchy refs
    const doc = await Document.findOne({
      _id: documentId,
      student: req.user._id,
    }).populate({
      path: "experiment",
      populate: { path: "subject", populate: { path: "semester" } },
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found or access denied",
      });
    }

    const entry = await PrintHistory.create({
      student: req.user._id,
      document: doc._id,
      experiment: doc.experiment._id,
      subject: doc.experiment.subject._id,
      semester: doc.experiment.subject.semester._id,
      pageCount: doc.pageCount || 0,
    });

    // Mark the document as printed so the reminder cron job skips it
    await Document.findByIdAndUpdate(doc._id, { isPrinted: true });

    res.status(201).json({
      success: true,
      message: "Print logged successfully",
      entry,
    });
  } catch (error) {
    console.error("Log Print Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to log print",
    });
  }
};

// GET /api/print-history
const getMyPrintHistory = async (req, res) => {
  try {
    const history = await PrintHistory.find({ student: req.user._id })
      .populate("document", "fileName fileSize pageCount")
      .populate("experiment", "experimentNumber title")
      .populate("subject", "name code")
      .populate("semester", "number name")
      .sort({ printedAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Get Print History Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch print history",
    });
  }
};

// GET /api/print-history/admin/stats
// Admin-only endpoint for system-wide print statistics
const getAdminStats = async (req, res) => {
  try {
    // Total prints
    const totalPrints = await PrintHistory.countDocuments();

    // Total pages printed
    const pageStats = await PrintHistory.aggregate([
      { $group: { _id: null, totalPages: { $sum: "$pageCount" } } },
    ]);
    const totalPages = pageStats[0]?.totalPages || 0;

    // Total documents uploaded
    const totalDocuments = await Document.countDocuments();

    // Total unique students who uploaded documents
    const uniqueDocumentStudents = await Document.distinct("student");
    const totalDocumentStudents = uniqueDocumentStudents.length;

    // Total unique students who printed
    const uniquePrintStudents = await PrintHistory.distinct("student");
    const totalPrintStudents = uniquePrintStudents.length;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPrints = await PrintHistory.countDocuments({
      printedAt: { $gte: sevenDaysAgo },
    });

    const recentDocuments = await Document.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Activity by day (last 7 days)
    const dailyActivity = await PrintHistory.aggregate([
      { $match: { printedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$printedAt" },
          },
          printCount: { $sum: 1 },
          pageCount: { $sum: "$pageCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top subjects by prints
    const topSubjects = await PrintHistory.aggregate([
      {
        $group: {
          _id: "$subject",
          printCount: { $sum: 1 },
          pageCount: { $sum: "$pageCount" },
        },
      },
      { $sort: { printCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $project: {
          _id: 0,
          subjectId: "$subject._id",
          subjectName: "$subject.name",
          subjectCode: "$subject.code",
          printCount: 1,
          pageCount: 1,
        },
      },
    ]);

    // Top students by prints
    const topStudents = await PrintHistory.aggregate([
      { $group: { _id: "$student", printCount: { $sum: 1 }, pageCount: { $sum: "$pageCount" } } },
      { $sort: { printCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $project: {
          _id: 0,
          studentId: "$student._id",
          studentName: "$student.name",
          studentEmail: "$student.email",
          printCount: 1,
          pageCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totals: {
          prints: totalPrints,
          pages: totalPages,
          documents: totalDocuments,
          documentStudents: totalDocumentStudents,
          printStudents: totalPrintStudents,
        },
        recent: {
          printsLast7Days: recentPrints,
          documentsLast7Days: recentDocuments,
        },
        dailyActivity,
        topSubjects,
        topStudents,
      },
    });
  } catch (error) {
    console.error("Get Admin Stats Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch statistics" });
  }
};

module.exports = { logPrint, getMyPrintHistory, getAdminStats };
