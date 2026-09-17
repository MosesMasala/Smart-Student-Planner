// js/dashboard.js

requireLogin();
setupSidebar("dashboard");

// ── GREETING + DATE ───────────────────────────────────────────────────────────
const user = getUser();
const hour = new Date().getHours();
const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
document.getElementById("welcome-msg").textContent = `${greeting}, ${user.name || "Student"} 👋`;
document.getElementById("today-date").textContent = new Date().toLocaleDateString("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric"
});

// ── LOAD EVERYTHING ───────────────────────────────────────────────────────────

async function loadDashboard() {
  try {
    // Generate fresh notifications first
    await apiRequest("/notifications/check", "POST");

    // Then load the full summary in one request
    const data = await apiRequest("/dashboard/summary");

    renderStats(data.counts);
    renderDueSoon(data.dueSoon);
    renderUpcomingSessions(data.upcomingSessions);
  } catch (err) {
    showToast("Failed to load dashboard data.", "error");
  }

  loadNotifications();
  loadNotifBadge();
}

// ── STATS ─────────────────────────────────────────────────────────────────────

function renderStats(counts) {
  document.getElementById("stat-courses").textContent     = counts.courses;
  document.getElementById("stat-assignments").textContent = counts.pendingAssignments;
  document.getElementById("stat-sessions").textContent    = counts.upcomingSessions;
  document.getElementById("stat-notifs").textContent      = counts.unreadNotifications;
}

// ── DUE SOON ─────────────────────────────────────────────────────────────────

function renderDueSoon(items) {
  const list = document.getElementById("due-soon-list");
  if (!items.length) {
    list.innerHTML = `
      <li>
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <div class="empty-title">You're all caught up!</div>
          <div class="empty-desc">No assignments due in the next 3 days.</div>
        </div>
      </li>`;
    return;
  }

  list.innerHTML = items.map(a => `
    <li>
      <div class="item-row ${getUrgencyClass(a.due_date, a.status)}">
        <div class="item-main">
          <div class="item-title">${escHtml(a.title)}</div>
          <div class="item-meta">
            ${a.course_name ? `<span>📖 ${escHtml(a.course_name)}</span><span class="dot">·</span>` : ""}
            <span style="color:var(--danger);font-weight:500;">${daysUntil(a.due_date)}</span>
          </div>
        </div>
        <span class="badge badge-${a.priority}">${a.priority}</span>
      </div>
    </li>`).join("");
}

// ── UPCOMING SESSIONS ─────────────────────────────────────────────────────────

function renderUpcomingSessions(items) {
  const list = document.getElementById("upcoming-sessions-list");
  if (!items.length) {
    list.innerHTML = `
      <li>
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-title">No sessions this week</div>
          <div class="empty-desc">Schedule a study session to stay on track.</div>
        </div>
      </li>`;
    return;
  }

  list.innerHTML = items.map(s => `
    <li>
      <div class="item-row">
        <div class="item-main">
          <div class="item-title">${escHtml(s.title)}</div>
          <div class="item-meta">
            ${s.course_name ? `<span>📖 ${escHtml(s.course_name)}</span><span class="dot">·</span>` : ""}
            <span>${formatDate(s.session_date)}${s.start_time ? " at " + s.start_time : ""}</span>
          </div>
        </div>
      </div>
    </li>`).join("");
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

async function loadNotifications() {
  try {
    const data = await apiRequest("/notifications");
    const container = document.getElementById("notif-list");

    if (!data.notifications.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <div class="empty-title">No reminders yet</div>
          <div class="empty-desc">Reminders appear here when assignments are due soon.</div>
        </div>`;
      return;
    }

    container.innerHTML = data.notifications.map(n => `
      <div class="notif-item" id="notif-${n.id}">
        <div class="notif-dot ${n.is_read ? "read" : "unread"}"></div>
        <div class="notif-text">
          <div class="notif-msg">${escHtml(n.message)}</div>
          <div class="notif-time">${formatDateTime(n.created_at)}</div>
        </div>
        <div class="notif-actions">
          <span class="badge badge-${n.type}">${n.type}</span>
          ${!n.is_read ? `<button class="btn btn-sm btn-ghost" onclick="markRead(${n.id})">Mark read</button>` : ""}
        </div>
      </div>`).join("");
  } catch (err) {
    showToast("Could not load reminders.", "error");
  }
}

async function markRead(id) {
  try {
    await apiRequest(`/notifications/${id}/read`, "PATCH");
    loadNotifications();
    loadNotifBadge();
    document.getElementById("stat-notifs").textContent =
      Math.max(0, parseInt(document.getElementById("stat-notifs").textContent) - 1);
  } catch (_) {}
}

document.getElementById("mark-all-read-btn").addEventListener("click", async () => {
  try {
    await apiRequest("/notifications/read-all", "PATCH");
    showToast("All reminders marked as read.");
    loadNotifications();
    loadNotifBadge();
    document.getElementById("stat-notifs").textContent = "0";
  } catch (err) {
    showToast(err.message, "error");
  }
});

// ── UTILITY ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── INIT ──────────────────────────────────────────────────────────────────────
loadDashboard();
