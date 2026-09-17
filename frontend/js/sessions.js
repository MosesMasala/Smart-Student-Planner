// js/sessions.js

requireLogin();
setupSidebar("sessions");
loadNotifBadge();

let sessions   = [];
let courses    = [];
let editingId  = null;
let deletingId = null;
let activeFilter = "upcoming";
let activeCourse = "";

// ── LOAD DATA ─────────────────────────────────────────────────────────────────

async function loadAll() {
  try {
    [sessions, courses] = await Promise.all([
      apiRequest("/study-sessions"),
      apiRequest("/courses"),
    ]);
    populateCourseDropdowns();
    applyFilters();
  } catch (err) {
    showToast("Could not load sessions.", "error");
  }
}

function populateCourseDropdowns() {
  const filterSel = document.getElementById("course-filter");
  const formSel   = document.getElementById("f-course");

  filterSel.innerHTML = '<option value="">All courses</option>';
  formSel.innerHTML   = '<option value="">No course</option>';

  courses.forEach(c => {
    filterSel.innerHTML += `<option value="${c.id}">${escHtml(c.name)}</option>`;
    formSel.innerHTML   += `<option value="${c.id}">${escHtml(c.name)}</option>`;
  });
}

// ── FILTERING ─────────────────────────────────────────────────────────────────

function applyFilters() {
  const today = new Date(); today.setHours(0,0,0,0);
  let visible = [...sessions];

  if (activeFilter === "upcoming") {
    visible = visible.filter(s => !s.completed && new Date(s.session_date + "T00:00:00") >= today);
  } else if (activeFilter === "completed") {
    visible = visible.filter(s => s.completed);
  }

  if (activeCourse) {
    visible = visible.filter(s => String(s.course_id) === String(activeCourse));
  }

  renderSessions(visible);
}

document.querySelectorAll(".filter-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeFilter = pill.dataset.filter;
    applyFilters();
  });
});

document.getElementById("course-filter").addEventListener("change", e => {
  activeCourse = e.target.value;
  applyFilters();
});

// ── RENDER ────────────────────────────────────────────────────────────────────
// Groups sessions by date before rendering

function renderSessions(items) {
  const container = document.getElementById("sessions-container");

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding:60px 20px;">
        <div class="empty-icon">🕐</div>
        <div class="empty-title">No sessions found</div>
        <div class="empty-desc">
          ${sessions.length === 0
            ? 'Schedule your first study session to stay organised.'
            : 'No sessions match the current filters.'}
        </div>
        ${sessions.length === 0
          ? '<button class="btn btn-primary" style="margin-top:16px;" onclick="openAdd()">+ Schedule Session</button>'
          : ''}
      </div>`;
    return;
  }

  // Group by date string e.g. "2026-08-04"
  const groups = {};
  items.forEach(s => {
    const key = s.session_date.substring(0, 10);
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  const today = new Date().toISOString().substring(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().substring(0, 10);

  container.innerHTML = Object.entries(groups).map(([date, group]) => {
    const isToday    = date === today;
    const isTomorrow = date === tomorrow;
    const label = isToday    ? "Today"
                : isTomorrow ? "Tomorrow"
                : formatDate(date);

    const items = group.map(s => `
      <div class="item-row ${s.completed ? "urgency-done" : ""}">
        <div class="item-main">
          <div class="item-title ${s.completed ? "completed-text" : ""}">${escHtml(s.title)}</div>
          <div class="item-meta">
            ${s.course_name ? `<span>📖 ${escHtml(s.course_name)}</span><span class="dot">·</span>` : ""}
            ${s.start_time ? `<span>🕐 ${s.start_time}${s.end_time ? " – " + s.end_time : ""}</span>` : ""}
            ${s.completed ? `<span class="badge badge-completed">Completed</span>` : ""}
          </div>
          ${s.notes ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">${escHtml(s.notes)}</div>` : ""}
        </div>
        <div class="item-actions">
          ${!s.completed
            ? `<button class="btn btn-sm btn-success" onclick="markComplete(${s.id})">✓ Done</button>`
            : `<button class="btn btn-sm btn-ghost"   onclick="markIncomplete(${s.id})">Reopen</button>`
          }
          <button class="btn btn-sm btn-ghost btn-icon" title="Edit"   onclick="openEdit(${s.id})">✏️</button>
          <button class="btn btn-sm btn-ghost btn-icon" title="Delete" onclick="openDelete(${s.id}, '${escAttr(s.title)}')">🗑️</button>
        </div>
      </div>`).join("");

    return `
      <div class="session-group">
        <div class="session-date-label ${isToday ? "today-label" : ""}">${label}</div>
        <div class="card">
          <div class="card-body">
            ${items}
          </div>
        </div>
      </div>`;
  }).join("");
}

// ── MARK COMPLETE / REOPEN ────────────────────────────────────────────────────

async function markComplete(id) {
  try {
    await apiRequest(`/study-sessions/${id}`, "PUT", { completed: true });
    showToast("Session marked as complete ✓");
    await loadAll();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function markIncomplete(id) {
  try {
    await apiRequest(`/study-sessions/${id}`, "PUT", { completed: false });
    showToast("Session reopened.");
    await loadAll();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ── ADD MODAL ─────────────────────────────────────────────────────────────────

function openAdd() {
  editingId = null;
  document.getElementById("modal-title").textContent    = "Schedule Study Session";
  document.getElementById("modal-save-btn").textContent = "Save Session";
  document.getElementById("f-title").value  = "";
  document.getElementById("f-date").value   = "";
  document.getElementById("f-start").value  = "";
  document.getElementById("f-end").value    = "";
  document.getElementById("f-notes").value  = "";
  document.getElementById("f-course").value = "";
  document.getElementById("modal-error").textContent = "";
  openModal("session-modal");
  document.getElementById("f-title").focus();
}

document.getElementById("open-add-btn").addEventListener("click", openAdd);

// ── EDIT MODAL ────────────────────────────────────────────────────────────────

function openEdit(id) {
  const s = sessions.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById("modal-title").textContent    = "Edit Session";
  document.getElementById("modal-save-btn").textContent = "Save Changes";
  document.getElementById("f-title").value  = s.title;
  document.getElementById("f-date").value   = s.session_date ? s.session_date.substring(0, 10) : "";
  document.getElementById("f-start").value  = s.start_time || "";
  document.getElementById("f-end").value    = s.end_time   || "";
  document.getElementById("f-notes").value  = s.notes      || "";
  document.getElementById("f-course").value = s.course_id  || "";
  document.getElementById("modal-error").textContent = "";
  openModal("session-modal");
  document.getElementById("f-title").focus();
}

// ── SAVE ──────────────────────────────────────────────────────────────────────

document.getElementById("modal-save-btn").addEventListener("click", async () => {
  const title    = document.getElementById("f-title").value.trim();
  const date     = document.getElementById("f-date").value;
  const errorEl  = document.getElementById("modal-error");
  const btn      = document.getElementById("modal-save-btn");

  if (!title) { errorEl.textContent = "Title is required.";        return; }
  if (!date)  { errorEl.textContent = "Session date is required."; return; }
  errorEl.textContent = "";
  btn.disabled = true;

  const payload = {
    title,
    session_date: date,
    start_time:   document.getElementById("f-start").value  || null,
    end_time:     document.getElementById("f-end").value    || null,
    notes:        document.getElementById("f-notes").value.trim(),
    course_id:    document.getElementById("f-course").value || null,
  };

  try {
    if (editingId) {
      await apiRequest(`/study-sessions/${editingId}`, "PUT", payload);
      showToast("Session updated.");
    } else {
      await apiRequest("/study-sessions", "POST", payload);
      showToast("Session scheduled.");
    }
    closeModal("session-modal");
    await loadAll();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

// ── DELETE ────────────────────────────────────────────────────────────────────

function openDelete(id, name) {
  deletingId = id;
  document.getElementById("delete-name").textContent = name;
  openModal("delete-modal");
}

document.getElementById("confirm-delete-btn").addEventListener("click", async () => {
  if (!deletingId) return;
  const btn = document.getElementById("confirm-delete-btn");
  btn.disabled = true;
  try {
    await apiRequest(`/study-sessions/${deletingId}`, "DELETE");
    showToast("Session deleted.");
    closeModal("delete-modal");
    deletingId = null;
    await loadAll();
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

// ── UTILS ─────────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escAttr(str) {
  return String(str || "").replace(/'/g, "\\'");
}

// ── INIT ──────────────────────────────────────────────────────────────────────
loadAll();
