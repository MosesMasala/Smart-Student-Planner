// models/Course.js
const { query } = require("../config/db");

async function createCourse(userId, name, description) {
  const result = await query(
    "INSERT INTO courses (user_id, name, description) VALUES ($1, $2, $3) RETURNING *",
    [userId, name, description || ""]
  );
  return result.rows[0];
}

async function getCoursesByUser(userId) {
  const result = await query(
    "SELECT * FROM courses WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
}

async function getCourseById(id, userId) {
  const result = await query(
    "SELECT * FROM courses WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rows[0];
}

async function updateCourse(id, userId, name, description) {
  const result = await query(
    "UPDATE courses SET name = $1, description = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
    [name, description, id, userId]
  );
  return result.rows[0];
}

async function deleteCourse(id, userId) {
  await query(
    "DELETE FROM courses WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}

module.exports = { createCourse, getCoursesByUser, getCourseById, updateCourse, deleteCourse };
