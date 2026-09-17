// js/api.js  —  shared across every page
// Contains: the fetch wrapper, toast messages, auth helpers, sidebar setup

const API_BASE = "/api";

// ── FETCH WRAPPER ─────────────────────────────────────────────────────────────
// Every call to the backend goes through this function.
// It automatically attaches the login token so you don't have to do it manually.

async function apiRequest(endpoint, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json();

  if (!response.ok) {
    // The backend returns either { error: "..." } or { errors: ["...", "..."] }
    const message = data.errors ? data.errors.join(" ") : (data.error || "Something went wrong.");
    throw new Error(message);
  }

  return data;
}

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────

function getUser() {
  return JSON.parse(localStorage.getItem("user") || "{}");
}

function requireLogin() {
  if (!localStorage.getItem("token")) {
    window.location.href = "/login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login.html";
}

// ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────────
// Small pop-up messages in the bottom-right corner for success/error feedback.

function ensureToastContainer() {
  let el = document.getElementById("toast-container");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast-container";
    el.className = "toast-container";
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = "success") {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || "•"}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── SIDEBAR SETUP ─────────────────────────────────────────────────────────────
// Marks the correct sidebar link as active and fills in the user's name.
// Called on every app page (dashboard, courses, assignments, sessions).

function setupSidebar(activePage) {
  const user = getUser();

  // Fill in user info in the sidebar footer
  const nameEl = document.getElementById("sidebar-user-name");
  const avatarEl = document.getElementById("sidebar-avatar");
  if (nameEl) nameEl.textContent = user.name || "Student";
  if (avatarEl) avatarEl.textContent = (user.name || "S")[0].toUpperCase();

  // Mark the current page link as active
  document.querySelectorAll(".sidebar-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === activePage);
  });

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Mobile hamburger menu
  const menuBtn = document.getElementById("menu-btn");
  const sidebar = document.querySelector(".sidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("is-open"));
    document.addEventListener("click", e => {
      if (!sidebar.contains(e.target) && e.target !== menuBtn) {
        sidebar.classList.remove("is-open");
      }
    });
  }
}

// ── NOTIFICATION BADGE ────────────────────────────────────────────────────────
// Loads the unread notification count and shows it on the bell icon.

async function loadNotifBadge() {
  try {
    const data = await apiRequest("/notifications");
    const badge = document.getElementById("notif-badge");
    if (!badge) return;
    if (data.unreadCount > 0) {
      badge.textContent = data.unreadCount > 9 ? "9+" : data.unreadCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  } catch (_) { /* silently fail — badge is non-critical */ }
}

// ── MODAL HELPERS ─────────────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).classList.add("is-open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("is-open");
}

// Close modal when clicking the dark backdrop (outside the modal card)
document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-backdrop")) {
    e.target.classList.remove("is-open");
  }
});

// Close modal on Escape key
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-backdrop.is-open")
      .forEach(m => m.classList.remove("is-open"));
  }
});

// ── URGENCY CLASS ─────────────────────────────────────────────────────────────
// Returns the CSS class that gives an assignment its coloured urgency ribbon.

function getUrgencyClass(dueDateStr, status) {
  if (status === "completed") return "urgency-done";
  if (!dueDateStr) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dueDateStr); due.setHours(0, 0, 0, 0);
  const diff  = Math.round((due - today) / 86400000);
  if (diff < 0)  return "urgency-today";   // overdue → red
  if (diff === 0) return "urgency-today";  // due today → red
  if (diff === 1) return "urgency-tomorrow"; // tomorrow → amber
  if (diff <= 7)  return "urgency-soon";   // this week → blue
  return "";
}

// ── DATE HELPERS ──────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return "No date";
  // DATE fields from PostgreSQL come as "YYYY-MM-DD" — append T00:00:00 to
  // prevent JavaScript treating them as UTC midnight (which shifts the date in
  // some timezones). TIMESTAMPTZ fields already contain "T", so leave them alone.
  const d = String(dateStr).includes("T")
    ? new Date(dateStr)
    : new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dateStr + "T00:00:00");
  const diff  = Math.round((due - today) / 86400000);
  if (diff < 0)  return "Overdue";
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}
