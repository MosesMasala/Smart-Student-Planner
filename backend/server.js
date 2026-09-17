// server.js
// Entry point. Run with: npm start  (or: npm run dev  for auto-restart)

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const { setupTables } = require("./config/db");

const authRoutes         = require("./routes/auth");
const courseRoutes       = require("./routes/courses");
const assignmentRoutes   = require("./routes/assignments");
const sessionRoutes      = require("./routes/studySessions");
const notificationRoutes = require("./routes/notifications");
const dashboardRoutes    = require("./routes/dashboard");
const errorHandler       = require("./middleware/errorHandler");

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend so everything runs from one URL: http://localhost:5000
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use("/api/auth",           authRoutes);
app.use("/api/courses",        courseRoutes);
app.use("/api/assignments",    assignmentRoutes);
app.use("/api/study-sessions", sessionRoutes);
app.use("/api/notifications",  notificationRoutes);
app.use("/api/dashboard",      dashboardRoutes);

// Health check - visit /api/health to confirm the server is running
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Smart Student Planner API is running." });
});

// ─── CENTRALISED ERROR HANDLER ────────────────────────────────────────────────
// Must come AFTER all routes. Catches any error passed to next(err).
app.use(errorHandler);

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Set up tables first, then start listening for requests
setupTables()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[Server] Failed to set up database tables:", err.message);
    process.exit(1); // stop the process if DB setup fails - something is seriously wrong
  });
