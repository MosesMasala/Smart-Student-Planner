// models/StudySession.js
const { query } = require("../config/db");

async function createSession(userId, { courseId, title, sessionDate, startTime, endTime, notes }) {
  const result = await query(
    `INSERT INTO study_sessions (user_id, course_id, title, session_date, start_time, end_time, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, courseId || null, title, sessionDate, startTime || null, endTime || null, notes || ""]
  );
  return result.rows[0];
}

async function getSessionsByUser(userId) {
  const result = await query(
    `SELECT s.*, c.name AS course_name
     FROM study_sessions s
     LEFT JOIN courses c ON s.course_id = c.id
     WHERE s.user_id = $1
     ORDER BY s.session_date ASC, s.start_time ASC`,
    [userId]
  );
  return result.rows;
}

// Returns upcoming sessions in the next N days (used for notifications)
async function getUpcomingSessions(userId, days = 3) {
  const result = await query(
    `SELECT s.*, c.name AS course_name
     FROM study_sessions s
     LEFT JOIN courses c ON s.course_id = c.id
     WHERE s.user_id = $1
       AND s.completed = FALSE
       AND s.session_date >= CURRENT_DATE
       AND s.session_date <= CURRENT_DATE + ($2 || ' days')::INTERVAL
     ORDER BY s.session_date ASC`,
    [userId, days]
  );
  return result.rows;
}

async function getSessionById(id, userId) {
  const result = await query(
    "SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rows[0];
}

async function updateSession(id, userId, fields) {
  const { title, sessionDate, startTime, endTime, courseId, notes, completed } = fields;
  const result = await query(
    `UPDATE study_sessions
     SET title = $1, session_date = $2, start_time = $3,
         end_time = $4, course_id = $5, notes = $6, completed = $7
     WHERE id = $8 AND user_id = $9
     RETURNING *`,
    [title, sessionDate, startTime || null, endTime || null, courseId || null, notes || "", completed, id, userId]
  );
  return result.rows[0];
}

async function deleteSession(id, userId) {
  await query(
    "DELETE FROM study_sessions WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}

module.exports = {
  createSession,
  getSessionsByUser,
  getUpcomingSessions,
  getSessionById,
  updateSession,
  deleteSession,
};
