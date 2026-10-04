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
  process.env.CLIENT_URL,                                    // set via Render env var
  "https://academic-print-manager.vercel.app",               // production fallback
  "http://localhost:5173",                                    // Vite dev server
  "http://localhost:4173",                                    // Vite preview
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Handle preflight OPTIONS requests for all routes
app.options("/{*path}", cors(corsOptions));
app.use(cors(corsOptions));

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

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.send("<h2>No code received.</h2>");
  }

  try {
    const { google } = require("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
    const { tokens } = await oauth2Client.getToken(code);
    res.send(`
      <h2>✅ Authorization successful!</h2>
      <p>Copy this refresh token into your <code>.env</code> as <code>GOOGLE_REFRESH_TOKEN</code>:</p>
      <textarea rows="4" cols="80" onclick="this.select()">${tokens.refresh_token || "(no refresh token — try again with prompt=consent)"}</textarea>
      <p><strong>Access token</strong> (ignore this): ${tokens.access_token?.slice(0, 30)}…</p>
      <p>You can close this tab.</p>
    `);
  } catch (err) {
    res.send(`<h2>❌ Failed: ${err.message}</h2><p>The code may have expired. <a href="javascript:history.back()">Go back</a> and try again.</p>`);
  }
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
