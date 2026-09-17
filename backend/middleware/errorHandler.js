// middleware/errorHandler.js
//
// A centralised error handler. In Express, if any route calls next(err),
// it skips all normal middleware and lands here instead.
// This means we don't have to write try/catch in every single route.
//
// Usage in a route:
//   } catch (err) { next(err); }

function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.message);

  // Postgres constraint violations (e.g. duplicate email) have a specific code
  if (err.code === "23505") {
    return res.status(400).json({ error: "That email address is already registered." });
  }

  // Postgres foreign key violations
  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced record does not exist." });
  }

  // Default: internal server error
  res.status(500).json({ error: "Something went wrong on the server. Please try again." });
}

module.exports = errorHandler;
