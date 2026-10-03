require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/models/User");

const seedAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;

    if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be configured",
      );
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin already exists. No new admin created.");
      process.exit(0);
    }

    // Create the first admin
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
    });

    console.log(`Admin created successfully: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
