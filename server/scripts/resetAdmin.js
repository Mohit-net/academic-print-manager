/**
 * One-time script: resets the admin password, or creates an admin if none exists.
 * Usage: node scripts/resetAdmin.js
 * Requires ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env
 */
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

const reset = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;

    if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const existing = await User.findOne({ role: "admin" });

    if (existing) {
      // Reset the password — pre-save hook will hash it
      existing.password = ADMIN_PASSWORD;
      if (ADMIN_NAME) existing.name = ADMIN_NAME;
      if (ADMIN_EMAIL) existing.email = ADMIN_EMAIL.toLowerCase();
      await existing.save();
      console.log(`✓ Admin password reset for: ${existing.email}`);
    } else {
      // No admin exists yet — create one
      const admin = await User.create({
        name: ADMIN_NAME || "Admin",
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD,
        role: "admin",
      });
      console.log(`✓ Admin created: ${admin.email}`);
    }

    console.log(`\nLogin credentials:`);
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

reset();
