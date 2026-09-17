// models/Notification.js
const { query } = require("../config/db");

async function createNotification(userId, message, type = "reminder") {
  const result = await query(
    "INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3) RETURNING *",
    [userId, message, type]
  );
  return result.rows[0];
}

async function getNotificationsByUser(userId) {
  const result = await query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return result.rows;
}

async function markAsRead(id, userId) {
  await query(
    "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
}

async function markAllAsRead(userId) {
  await query(
    "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
    [userId]
  );
}

async function getUnreadCount(userId) {
  const result = await query(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE",
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
