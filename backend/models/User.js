// models/User.js
// Database query functions for the users table.
// All functions are async because PostgreSQL queries are asynchronous.

const { query } = require("../config/db");

async function createUser(name, email, hashedPassword) {
  // RETURNING id means PostgreSQL gives us back the new row's id immediately
  const result = await query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
    [name, email, hashedPassword]
  );
  return result.rows[0].id;
}

async function findUserByEmail(email) {
  const result = await query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0]; // undefined if no user found
}

async function findUserById(id) {
  const result = await query(
    "SELECT id, name, email, created_at FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0];
}

module.exports = { createUser, findUserByEmail, findUserById };
