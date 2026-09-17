// routes/courses.js
const express = require("express");
const requireAuth = require("../middleware/auth");
const { createCourse, getCoursesByUser, getCourseById, updateCourse, deleteCourse } = require("../models/Course");
const { validateRequired, collectErrors } = require("../utils/validate");

const router = express.Router();
router.use(requireAuth);

// GET /api/courses
router.get("/", async (req, res, next) => {
  try {
    const courses = await getCoursesByUser(req.userId);
    res.json(courses);
  } catch (err) { next(err); }
});

// POST /api/courses
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const errors = collectErrors([validateRequired(name, "Course name")]);
    if (errors.length > 0) return res.status(400).json({ errors });

    const course = await createCourse(req.userId, name.trim(), description);
    res.status(201).json(course);
  } catch (err) { next(err); }
});

// PUT /api/courses/:id
router.put("/:id", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const errors = collectErrors([validateRequired(name, "Course name")]);
    if (errors.length > 0) return res.status(400).json({ errors });

    const existing = await getCourseById(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ errors: ["Course not found."] });

    const updated = await updateCourse(req.params.id, req.userId, name.trim(), description);
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/courses/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await getCourseById(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ errors: ["Course not found."] });

    await deleteCourse(req.params.id, req.userId);
    res.json({ message: "Course deleted." });
  } catch (err) { next(err); }
});

module.exports = router;
