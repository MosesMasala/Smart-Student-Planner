// models/Assignment.js
const { query } = require("../config/db");

async function createAssignment(userId, { courseId, title, description, dueDate, priority }) {
  const result = await query(
    `INSERT INTO assignments (user_id, course_id, title, description, due_date, priority)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, courseId || null, title, description || "", dueDate || null, priority || "medium"]
  );
  return result.rows[0];
}

async function getAssignmentsByUser(userId) {
  // LEFT JOIN pulls in the course name so the frontend doesn't need a second request
  const result = await query(
    `SELECT a.*, c.name AS course_name
     FROM assignments a
     LEFT JOIN courses c ON a.course_id = c.id
     WHERE a.user_id = $1
     ORDER BY
       CASE WHEN a.due_date IS NULL THEN 1 ELSE 0 END,  -- nulls last
       a.due_date ASC,
       CASE a.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
    [userId]
  );
  return result.rows;
}

// Returns assignments due within the next N days (used for notifications)
async function getDueSoonAssignments(userId, days = 3) {
  const result = await query(
    `SELECT a.*, c.name AS course_name
     FROM assignments a
     LEFT JOIN courses c ON a.course_id = c.id
     WHERE a.user_id = $1
       AND a.status != 'completed'
       AND a.due_date IS NOT NULL
       AND a.due_date <= CURRENT_DATE + ($2 || ' days')::INTERVAL
       AND a.due_date >= CURRENT_DATE
     ORDER BY a.due_date ASC`,
    [userId, days]
  );
  return result.rows;
}

async function getAssignmentById(id, userId) {
  const result = await query(
    "SELECT * FROM assignments WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rows[0];
}

async function updateAssignment(id, userId, fields) {
  const { title, description, dueDate, courseId, priority, status } = fields;
  const result = await query(
    `UPDATE assignments
     SET title = $1, description = $2, due_date = $3,
         course_id = $4, priority = $5, status = $6
     WHERE id = $7 AND user_id = $8
     RETURNING *`,
    [title, description, dueDate || null, courseId || null, priority, status, id, userId]
  );
  return result.rows[0];
}

async function deleteAssignment(id, userId) {
  await query(
    "DELETE FROM assignments WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}

module.exports = {
  createAssignment,
  getAssignmentsByUser,
  getDueSoonAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
};
