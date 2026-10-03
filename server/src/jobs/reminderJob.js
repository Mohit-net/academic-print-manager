/**
 * Deadline reminder cron job.
 *
 * Runs every day at 08:00 AM server time.
 * Finds all Documents where:
 *   - submissionDeadline is tomorrow (within the next 24–48 hours)
 *   - isPrinted is false
 *   - reminderSent is false
 *
 * Sends an FCM push notification to all FCM tokens for that student,
 * then marks reminderSent = true so they only get one reminder.
 */
const cron        = require("node-cron");
const Document    = require("../models/Document");
const User        = require("../models/User");
const { sendPush } = require("../services/notificationService");

const runReminderJob = async () => {
  try {
    // Window: "tomorrow" = 24 h from now up to 48 h from now
    const now        = new Date();
    const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 h
    const windowEnd   = new Date(now.getTime() + 48 * 60 * 60 * 1000); // +48 h

    const dueDocs = await Document.find({
      submissionDeadline: { $gte: windowStart, $lt: windowEnd },
      isPrinted:    false,
      reminderSent: false,
    })
      .populate("student", "name fcmTokens notificationPreferences")
      .populate({
        path: "experiment",
        select: "experimentNumber title subject",
        populate: { path: "subject", select: "name" },
      });

    if (dueDocs.length === 0) {
      console.log(`[ReminderJob] ${new Date().toISOString()} — no reminders to send.`);
      return;
    }

    console.log(`[ReminderJob] ${new Date().toISOString()} — sending ${dueDocs.length} reminder(s)…`);

    for (const doc of dueDocs) {
      const student = doc.student;

      // Skip if student has no FCM tokens
      if (!student?.fcmTokens?.length) {
        // Still mark sent so we don't loop on it again
        await Document.findByIdAndUpdate(doc._id, { reminderSent: true });
        continue;
      }

      const deadlineStr = new Date(doc.submissionDeadline).toLocaleDateString("en-IN", {
        day:   "numeric",
        month: "short",
        year:  "numeric",
      });

      const expLabel = doc.experiment
        ? `Experiment #${doc.experiment.experimentNumber}` +
          (doc.experiment.title ? ` — ${doc.experiment.title}` : "")
        : "an experiment";

      const subjectName = doc.experiment?.subject?.name || "";

      const title = "📋 Submission Deadline Tomorrow";
      const body  = `${expLabel}${subjectName ? ` (${subjectName})` : ""} is due on ${deadlineStr}. Don't forget to print your document!`;

      const { sent, invalidTokens } = await sendPush(
        student.fcmTokens,
        title,
        body,
        {
          type:       "deadline_reminder",
          documentId: String(doc._id),
          deadline:   String(doc.submissionDeadline),
          url:        "/student/documents",
        }
      );

      // Remove stale tokens from the user record
      if (invalidTokens.length > 0) {
        await User.findByIdAndUpdate(student._id, {
          $pull: { fcmTokens: { $in: invalidTokens } },
        });
      }

      // Mark reminder sent regardless of send result — prevents retry storms
      await Document.findByIdAndUpdate(doc._id, { reminderSent: true });

      console.log(
        `[ReminderJob] Student "${student.name}" — sent ${sent}, failed ${invalidTokens.length} stale token(s).`
      );
    }
  } catch (err) {
    console.error("[ReminderJob] Error:", err.message);
  }
};

/**
 * Schedules the job.
 * Call this once from server.js after the DB is connected.
 */
const scheduleReminderJob = () => {
  // "0 8 * * *" = every day at 08:00 AM
  cron.schedule("0 8 * * *", runReminderJob, {
    timezone: "Asia/Kolkata", // IST — change if needed
  });
  console.log("[ReminderJob] Deadline reminder job scheduled (daily 08:00 IST).");
};

module.exports = { scheduleReminderJob, runReminderJob };
