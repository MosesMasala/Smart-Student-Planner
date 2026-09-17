// middleware/auth.js
//
// This middleware function runs BEFORE any protected route handler.
// It checks the request for a valid login token.
// If the token is missing or invalid, it stops the request here and returns 401.
// If valid, it attaches req.userId so routes know who is logged in.

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  // We expect the header to look like: Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No login token provided. Please log in." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // make the user's id available to route handlers
    next();                      // continue to the actual route
  } catch (err) {
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
}

module.exports = requireAuth;
