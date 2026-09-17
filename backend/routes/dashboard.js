// routes/dashboard.js
//
// A single endpoint that returns everything the dashboard needs
// at a glance: counts, due-soon items, and upcoming sessions.
// This is more efficient than the frontend making 4 separate calls.

const express = require("express");
const requireAuth = require("../middleware/auth");
const { query } = require("../config/db");
const { getDueSoonAssignments } = require("../models/Assignment");
const { getUpcomingSessions } = require("../models/StudySession");
const { getUnreadCount } = require("../models/Notification");

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard/summary
router.get("/summary", async (req, res, next) => {
  try {
    const days = parseInt(process.env.DUE_SOON_DAYS || "3", 10);
    const userId = req.userId;

    // Run all queries at the same time using Promise.all (faster than one by one)
    const [
      coursesResult,
      assignmentsResult,
      sessionsResult,
      dueSoon,
      upcomingSessions,
      unreadCount,
    ] = await Promise.all([
      query("SELECT COUNT(*) AS count FROM courses WHERE user_id = $1", [userId]),
      query("SELECT COUNT(*) AS count FROM assignments WHERE user_id = $1 AND status != 'completed'", [userId]),
      query("SELECT COUNT(*) AS count FROM study_sessions WHERE user_id = $1 AND completed = FALSE AND session_date >= CURRENT_DATE", [userId]),
      getDueSoonAssignments(userId, days),
      getUpcomingSessions(userId, days),
      getUnreadCount(userId),
    ]);

    res.json({
      counts: {
        courses:             parseInt(coursesResult.rows[0].count, 10),
        pendingAssignments:  parseInt(assignmentsResult.rows[0].count, 10),
        upcomingSessions:    parseInt(sessionsResult.rows[0].count, 10),
        unreadNotifications: unreadCount,
      },
      dueSoon,
      upcomingSessions,
    });
  } catch (err) { next(err); }
});

module.exports = router;
