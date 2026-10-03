require("dotenv").config();

const app       = require("./src/app");
const connectDB = require("./src/config/db");
const { scheduleReminderJob } = require("./src/jobs/reminderJob");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    scheduleReminderJob();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch {
    process.exit(1);
  }
};

startServer();
