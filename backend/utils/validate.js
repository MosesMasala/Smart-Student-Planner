// utils/validate.js
//
// Small reusable validation helpers so routes stay clean.
// Each function returns an error string if something is wrong,
// or null if everything is fine.

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return "A valid email address is required.";
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  return null;
}

function validateRequired(value, fieldName) {
  if (!value || String(value).trim() === "") {
    return `${fieldName} is required.`;
  }
  return null;
}

function validateDate(dateStr, fieldName = "Date") {
  if (!dateStr) return null; // dates are often optional
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return `${fieldName} must be a valid date (YYYY-MM-DD).`;
  }
  return null;
}

function validateEnum(value, allowed, fieldName) {
  if (!value) return null; // if not provided, the DB default handles it
  if (!allowed.includes(value)) {
    return `${fieldName} must be one of: ${allowed.join(", ")}.`;
  }
  return null;
}

// Collects multiple errors and returns them as an array.
// Usage: const errors = collectErrors([validateRequired(title, "Title"), validateDate(due_date)])
function collectErrors(checks) {
  return checks.filter(Boolean); // remove nulls, keep error strings
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRequired,
  validateDate,
  validateEnum,
  collectErrors,
};
