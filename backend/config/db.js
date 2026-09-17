// config/db.js
//
// This file does two things:
//   1. Creates a CONNECTION POOL to PostgreSQL.
//      A pool keeps several database connections open and reuses them,
//      which is faster than opening a new connection for every request.
//   2. Creates all the tables the first time the app runs.
//
// KEY DIFFERENCE FROM SQLite:
//   Every query to PostgreSQL is asynchronous - it returns a Promise.
//   That means every function that talks to the database must use async/await.

const { Pool } = require("pg");

// The pool reads your connection details from the .env file
const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || "student_planner",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "",
});

// ─── HELPER FUNCTION ─────────────────────────────────────────────────────────
//
// query() wraps pool.query() so the rest of the app doesn't need to
// think about the pool directly. You just call:
//
//   const result = await query("SELECT * FROM users WHERE id = $1", [userId]);
//
// PostgreSQL uses $1, $2, $3 etc. as placeholders (SQLite uses ?)

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

// ─── TABLE SETUP ─────────────────────────────────────────────────────────────
//
// This runs once at startup. "IF NOT EXISTS" means it's safe to run every time
// - it only creates a table if it isn't already there.

async function setupTables() {
  // SERIAL = auto-incrementing integer (PostgreSQL's version of AUTOINCREMENT)
  // TIMESTAMPTZ = timestamp with timezone
  // BOOLEAN = true/false (PostgreSQL supports this natively, unlike SQLite)

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL      PRIMARY KEY,
      name        TEXT        NOT NULL,
      email       TEXT        NOT NULL UNIQUE,
      password    TEXT        NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS courses (
      id          SERIAL      PRIMARY KEY,
      user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT        NOT NULL,
      description TEXT        NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // priority uses CHECK to enforce only these three values are allowed
  await query(`
    CREATE TABLE IF NOT EXISTS assignments (
      id          SERIAL      PRIMARY KEY,
      user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id   INTEGER     REFERENCES courses(id) ON DELETE SET NULL,
      title       TEXT        NOT NULL,
      description TEXT        NOT NULL DEFAULT '',
      due_date    DATE,
      priority    TEXT        NOT NULL DEFAULT 'medium'
                              CHECK (priority IN ('low', 'medium', 'high')),
      status      TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'in_progress', 'completed')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id            SERIAL      PRIMARY KEY,
      user_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id     INTEGER     REFERENCES courses(id) ON DELETE SET NULL,
      title         TEXT        NOT NULL,
      session_date  DATE        NOT NULL,
      start_time    TIME,
      end_time      TIME,
      notes         TEXT        NOT NULL DEFAULT '',
      completed     BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id          SERIAL      PRIMARY KEY,
      user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message     TEXT        NOT NULL,
      type        TEXT        NOT NULL DEFAULT 'reminder'
                              CHECK (type IN ('reminder', 'warning', 'info')),
      is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  console.log("[DB] Tables ready.");
}

module.exports = { query, setupTables };
