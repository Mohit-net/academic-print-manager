const semesterRoutes = require("./routes/semesterRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const experimentRoutes = require("./routes/experimentRoutes");
const documentRoutes = require("./routes/documentRoutes");
const authRoutes = require("./routes/authRoutes");
const printHistoryRoutes = require("./routes/printHistoryRoutes");
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/experiments", experimentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/print-history", printHistoryRoutes);
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Academic Print Manager API is running",
  });
});

app.get("/oauth2callback", (req, res) => {
  res.send(`
    <h2>Authorization successful!</h2>
    <p>You can close this page and return to the terminal.</p>
    <p>Authorization code received.</p>
  `);
});

// Convert Multer's validation errors into useful client responses instead of
// Express's default HTML error page.
app.use((error, req, res, next) => {
  if (error && error.name === "MulterError") {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error && error.message === "Only PDF files are allowed") {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ success: false, message: "Invalid JSON body" });
  }

  console.error("Unhandled application error:", error);
  res.status(500).json({
    success: false,
    message: "Something went wrong while processing the request",
  });
});

module.exports = app;
