// routes/assignments.js
const express = require("express");
const requireAuth = require("../middleware/auth");
const {
  createAssignment, getAssignmentsByUser, getDueSoonAssignments,
  getAssignmentById, updateAssignment, deleteAssignment,
} = require("../models/Assignment");
const { validateRequired, validateDate, validateEnum, collectErrors } = require("../utils/validate");

const router = express.Router();
router.use(requireAuth);

// GET /api/assignments
router.get("/", async (req, res, next) => {
  try {
    const assignments = await getAssignmentsByUser(req.userId);
    res.json(assignments);
  } catch (err) { next(err); }
});

// GET /api/assignments/due-soon
router.get("/due-soon", async (req, res, next) => {
  try {
    const days = parseInt(process.env.DUE_SOON_DAYS || "3", 10);
    const assignments = await getDueSoonAssignments(req.userId, days);
    res.json(assignments);
  } catch (err) { next(err); }
});

// POST /api/assignments
router.post("/", async (req, res, next) => {
  try {
    const { title, description, due_date, course_id, priority } = req.body;
    const errors = collectErrors([
      validateRequired(title, "Title"),
      validateDate(due_date, "Due date"),
      validateEnum(priority, ["low", "medium", "high"], "Priority"),
    ]);
    if (errors.length > 0) return res.status(400).json({ errors });

    const assignment = await createAssignment(req.userId, {
      courseId: course_id,
      title: title.trim(),
      description,
      dueDate: due_date,
      priority,
    });
    res.status(201).json(assignment);
  } catch (err) { next(err); }
});

// PUT /api/assignments/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await getAssignmentById(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ errors: ["Assignment not found."] });

    const { title, description, due_date, course_id, priority, status } = req.body;
    const errors = collectErrors([
      validateRequired(title ?? existing.title, "Title"),
      validateDate(due_date, "Due date"),
      validateEnum(priority, ["low", "medium", "high"], "Priority"),
      validateEnum(status, ["pending", "in_progress", "completed"], "Status"),
    ]);
    if (errors.length > 0) return res.status(400).json({ errors });

    const updated = await updateAssignment(req.params.id, req.userId, {
      title: (title ?? existing.title).trim(),
      description: description ?? existing.description,
      dueDate: due_date ?? existing.due_date,
      courseId: course_id ?? existing.course_id,
      priority: priority ?? existing.priority,
      status: status ?? existing.status,
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/assignments/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getAssignmentById(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ errors: ["Assignment not found."] });

    await deleteAssignment(req.params.id, req.userId);
    res.json({ message: "Assignment deleted." });
  } catch (err) { next(err); }
});

module.exports = router;
