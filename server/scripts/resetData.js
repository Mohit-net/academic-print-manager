/**
 * resetData.js
 *
 * Wipes all academic + student data from MongoDB and deletes all uploaded
 * files from Google Drive — leaving the admin account intact.
 *
 * Usage:
 *   node scripts/resetData.js
 *
 * Requires server/.env to be configured (same as production).
 */

require("dotenv").config();

const mongoose  = require("mongoose");
const { google } = require("googleapis");

// ── Models ────────────────────────────────────────────────────────────────────
const Document     = require("../src/models/Document");
const PrintHistory = require("../src/models/PrintHistory");
const Semester     = require("../src/models/Semester");
const Subject      = require("../src/models/Subject");
const Experiment   = require("../src/models/Experiment");
const User         = require("../src/models/User");

// ── Google Drive client ───────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oauth2Client });

// ─────────────────────────────────────────────────────────────────────────────

const deleteFromDrive = async (driveFileIds) => {
  if (!driveFileIds.length) return;
  console.log(`\n🗑  Deleting ${driveFileIds.length} file(s) from Google Drive…`);

  let deleted = 0;
  let failed  = 0;

  for (const fileId of driveFileIds) {
    try {
      await drive.files.delete({ fileId });
      deleted++;
    } catch (err) {
      // 404 means the file was already removed from Drive — treat as success
      if (err?.status === 404 || err?.code === 404) {
        deleted++;
      } else {
        console.warn(`  ⚠  Could not delete Drive file ${fileId}: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`  ✓ Deleted: ${deleted}   ✗ Failed: ${failed}`);
};

const reset = async () => {
  const { MONGODB_URI } = process.env;
  if (!MONGODB_URI) {
    console.error("❌  MONGODB_URI is not set in server/.env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("✓ Connected.\n");

  // ── 1. Collect Google Drive file IDs before deleting DB records ──────────
  const documents = await Document.find({}, "googleDriveFileId").lean();
  const driveFileIds = documents
    .map((d) => d.googleDriveFileId)
    .filter(Boolean);

  // ── 2. Wipe MongoDB collections ──────────────────────────────────────────
  console.log("Clearing database collections…");

  const results = await Promise.allSettled([
    PrintHistory.deleteMany({}),
    Document.deleteMany({}),
    Experiment.deleteMany({}),
    Subject.deleteMany({}),
    Semester.deleteMany({}),
    // Remove student accounts only — keep admin accounts
    User.deleteMany({ role: "student" }),
  ]);

  const labels = [
    "PrintHistory",
    "Documents",
    "Experiments",
    "Subjects",
    "Semesters",
    "Student accounts",
  ];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`  ✓ ${labels[i]}: ${r.value.deletedCount} record(s) removed`);
    } else {
      console.warn(`  ⚠  ${labels[i]}: ${r.reason?.message}`);
    }
  });

  // ── 3. Clear FCM tokens from admin accounts ───────────────────────────────
  await User.updateMany({ role: "admin" }, { $set: { fcmTokens: [] } });
  console.log("  ✓ FCM tokens cleared from admin accounts");

  // ── 4. Delete files from Google Drive ────────────────────────────────────
  await deleteFromDrive(driveFileIds);

  console.log("\n✅  Reset complete. The database is clean and ready to use.");
  console.log("    Admin account(s) have been preserved.\n");

  await mongoose.disconnect();
  process.exit(0);
};

reset().catch((err) => {
  console.error("❌  Reset failed:", err.message);
  process.exit(1);
});
