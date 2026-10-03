/**
 * One-time fix: drops the non-sparse unique index on subjects.code
 * and lets Mongoose recreate it correctly as sparse on next server start.
 *
 * Run once: node scripts/fixSubjectIndex.js
 */
require("dotenv").config();

const mongoose = require("mongoose");

const fix = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const collection = db.collection("subjects");

    // List existing indexes so we can see what's there
    const indexes = await collection.indexes();
    console.log("Current indexes on subjects:");
    indexes.forEach((idx) => console.log(" ", JSON.stringify(idx)));

    // Drop the bad index by name
    try {
      await collection.dropIndex("code_1");
      console.log("\n✓ Dropped index: code_1");
    } catch (err) {
      if (err.codeName === "IndexNotFound") {
        console.log("\n⚠ Index code_1 not found — may already be correct.");
      } else {
        throw err;
      }
    }

    // Mongoose will recreate it correctly (with sparse:true) on next connect
    console.log("✓ Done. Start the server normally — the correct sparse index will be created automatically.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

fix();
