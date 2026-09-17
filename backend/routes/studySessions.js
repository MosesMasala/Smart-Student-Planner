// routes/studySessions.js
const express = require("express");
const requireAuth = require("../middleware/auth");
const {
  createSession, getSessionsByUser, getUpcomingSessions,
  getSessionById, updateSession, deleteSession,
} = require("../models/StudySession");
const { validateRequired, validateDate, collectErrors } = require("../utils/validate");

const router = express.Router();
router.use(requireAuth);

// GET /api/study-sessions
router.get("/", async (req, res, next) => {
  try {
    const sessions = await getSessionsByUser(req.userId);
    res.json(sessions);
  } catch (err) { next(err); }
});

// GET /api/study-sessions/upcoming
router.get("/upcoming", async (req, res, next) => {
  try {
    const days = parseInt(process.env.DUE_SOON_DAYS || "3", 10);
    const sessions = await getUpcomingSessions(req.userId, days);
    res.json(sessions);
  } catch (err) { next(err); }
});

// POST /api/study-sessions
router.post("/", async (req, res, next) => {
  try {
    const { title, session_date, start_time, end_time, course_id, notes } = req.body;
    const errors = collectErrors([
      validateRequired(title, "Title"),
      validateRequired(session_date, "Session date"),
      validateDate(session_date, "Session date"),
    ]);
    if (errors.length > 0) return res.status(400).json({ errors });

    const session = await createSession(req.userId, {
      courseId: course_id,
      title: title.trim(),
      sessionDate: session_date,
      startTime: start_time,
      endTime: end_time,
      notes,
    });
    res.status(201).json(session);
  } catch (err) { next(err); }
});

// PUT /api/study-sessions/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await getSessionById(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ errors: ["Study session not found."] });

    const { title, session_date, start_time, end_time, course_id, notes, completed } = req.body;
    const updated = await updateSession(req.params.id, req.userId, {
      title: (title ?? existing.title).trim(),
      sessionDate: session_date ?? existing.session_date,
      startTime: start_time ?? existing.start_time,
      endTime: end_time ?? existing.end_time,
      courseId: course_id ?? existing.course_id,
      notes: notes ?? existing.notes,
      completed: completed !== undefined ? completed : existing.completed,
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/study-sessions/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getSessionById(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ errors: ["Study session not found."] });

    await deleteSession(req.params.id, req.userId);
    res.json({ message: "Study session deleted." });
  } catch (err) { next(err); }
});

module.exports = router;
