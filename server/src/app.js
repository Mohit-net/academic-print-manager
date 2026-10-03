const semesterRoutes = require("./routes/semesterRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const experimentRoutes = require("./routes/experimentRoutes");
const documentRoutes = require("./routes/documentRoutes");
const authRoutes = require("./routes/authRoutes");
const printHistoryRoutes = require("./routes/printHistoryRoutes");
const express = require("express");
const cors = require("cors");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production only the deployed frontend is allowed.
// In development any localhost origin is permitted.
const allowedOrigins = [
  process.env.CLIENT_URL,           // e.g. https://academic-print-manager.vercel.app
  "http://localhost:5173",           // Vite dev server
  "http://localhost:4173",           // Vite preview
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

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
