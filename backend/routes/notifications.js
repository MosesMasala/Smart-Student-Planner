// routes/notifications.js
//
// The /api/notifications/check endpoint is the key one.
// The frontend calls it when the dashboard loads, and it automatically
// generates notifications for any assignments due soon or sessions coming up.

const express = require("express");
const requireAuth = require("../middleware/auth");
const {
  createNotification, getNotificationsByUser,
  markAsRead, markAllAsRead, getUnreadCount,
} = require("../models/Notification");
const { getDueSoonAssignments } = require("../models/Assignment");
const { getUpcomingSessions } = require("../models/StudySession");

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications
router.get("/", async (req, res, next) => {
  try {
    const notifications = await getNotificationsByUser(req.userId);
    const unreadCount = await getUnreadCount(req.userId);
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

// POST /api/notifications/check
// Call this when the dashboard loads to generate fresh reminder notifications.
// It checks for due-soon assignments and upcoming sessions, then creates
// a notification for any that don't already have one today.
router.post("/check", async (req, res, next) => {
  try {
    const days = parseInt(process.env.DUE_SOON_DAYS || "3", 10);
    const created = [];

    const dueSoon = await getDueSoonAssignments(req.userId, days);
    for (const assignment of dueSoon) {
      const daysLeft = Math.ceil(
        (new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      const label = daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
      const message = `Assignment due ${label}: "${assignment.title}"${assignment.course_name ? ` (${assignment.course_name})` : ""}`;
      const n = await createNotification(req.userId, message, "warning");
      created.push(n);
    }

    const upcoming = await getUpcomingSessions(req.userId, days);
    for (const session of upcoming) {
      const message = `Study session on ${session.session_date}: "${session.title}"${session.course_name ? ` (${session.course_name})` : ""}`;
      const n = await createNotification(req.userId, message, "reminder");
      created.push(n);
    }

    res.json({ message: `${created.length} notifications generated.`, created });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all
// MUST be defined BEFORE /:id/read — otherwise Express matches "read-all" as an :id
router.patch("/read-all", async (req, res, next) => {
  try {
    await markAllAsRead(req.userId);
    res.json({ message: "All notifications marked as read." });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res, next) => {
  try {
    await markAsRead(req.params.id, req.userId);
    res.json({ message: "Notification marked as read." });
  } catch (err) { next(err); }
});

module.exports = router;
