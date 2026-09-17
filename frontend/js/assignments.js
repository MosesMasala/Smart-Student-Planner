// js/assignments.js

requireLogin();
setupSidebar("assignments");
loadNotifBadge();

let assignments  = [];  // all assignments from API
let courses      = [];  // all courses (for dropdowns + filter)
let editingId    = null;
let deletingId   = null;
let activeStatus = "all";
let activeCourse = "";
let activePriority = "";

// ── LOAD DATA ─────────────────────────────────────────────────────────────────

async function loadAll() {
  try {
    [assignments, courses] = await Promise.all([
      apiRequest("/assignments"),
      apiRequest("/courses"),
    ]);
    populateCourseDropdowns();
    applyFilters();

    // If page was opened with ?course=ID pre-select that course filter
    const params = new URLSearchParams(window.location.search);
    if (params.get("course")) {
      document.getElementById("course-filter").value = params.get("course");
      activeCourse = params.get("course");
      applyFilters();
    }
  } catch (err) {
    showToast("Could not load assignments.", "error");
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

// ── FILTERING (client-side) ───────────────────────────────────────────────────

function applyFilters() {
  let visible = [...assignments];

  if (activeStatus !== "all") {
    visible = visible.filter(a => a.status === activeStatus);
  }
  if (activeCourse) {
    visible = visible.filter(a => String(a.course_id) === String(activeCourse));
  }
  if (activePriority) {
    visible = visible.filter(a => a.priority === activePriority);
  }

  renderList(visible);
}

// Status filter pills
document.querySelectorAll(".filter-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeStatus = pill.dataset.status;
    applyFilters();
  });
});

document.getElementById("course-filter").addEventListener("change", e => {
  activeCourse = e.target.value;
  applyFilters();
});

document.getElementById("priority-filter").addEventListener("change", e => {
  activePriority = e.target.value;
  applyFilters();
});

// ── RENDER LIST ───────────────────────────────────────────────────────────────

function renderList(items) {
  const list = document.getElementById("assignment-list");
  document.getElementById("list-count").textContent = items.length;

  if (!items.length) {
    list.innerHTML = `
      <li>
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No assignments found</div>
          <div class="empty-desc">
            ${assignments.length === 0
              ? 'Add your first assignment using the button above.'
              : 'No assignments match the current filters.'}
          </div>
        </div>
      </li>`;
    return;
  }

  list.innerHTML = items.map(a => {
    const urgency   = getUrgencyClass(a.due_date, a.status);
    const isComplete = a.status === "completed";
    const nextStatus = a.status === "pending" ? "in_progress"
                     : a.status === "in_progress" ? "completed"
                     : "pending";
    const nextLabel  = a.status === "pending"      ? "Start"
                     : a.status === "in_progress"  ? "Mark done"
                     : "Reopen";

    return `
      <li>
        <div class="item-row ${urgency}">
          <div class="item-main">
            <div class="item-title ${isComplete ? "completed-text" : ""}">${escHtml(a.title)}</div>
            <div class="item-meta">
              ${a.course_name ? `<span>📖 ${escHtml(a.course_name)}</span><span class="dot">·</span>` : ""}
              ${a.due_date ? `<span>${daysUntil(a.due_date)} (${formatDate(a.due_date)})</span><span class="dot">·</span>` : ""}
              <span class="badge badge-${a.priority}">${a.priority}</span>
              <span class="badge badge-${a.status}">${a.status.replace("_", " ")}</span>
            </div>
            ${a.description ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">${escHtml(a.description)}</div>` : ""}
          </div>
          <div class="item-actions">
            <button class="btn btn-sm btn-ghost" onclick="cycleStatus(${a.id}, '${nextStatus}')">${nextLabel}</button>
            <button class="btn btn-sm btn-ghost btn-icon" title="Edit"   onclick="openEdit(${a.id})">✏️</button>
            <button class="btn btn-sm btn-ghost btn-icon" title="Delete" onclick="openDelete(${a.id}, '${escAttr(a.title)}')">🗑️</button>
          </div>
        </div>
      </li>`;
  }).join("");
}

// ── STATUS CYCLE ──────────────────────────────────────────────────────────────
// One click cycles: pending → in_progress → completed → pending

async function cycleStatus(id, newStatus) {
  try {
    await apiRequest(`/assignments/${id}`, "PUT", { status: newStatus });
    const label = newStatus === "completed" ? "Marked as done ✓"
                : newStatus === "in_progress" ? "Marked in progress"
                : "Reopened";
    showToast(label);
    await loadAll();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ── ADD MODAL ─────────────────────────────────────────────────────────────────

function openAdd() {
  editingId = null;
  document.getElementById("modal-title").textContent    = "Add Assignment";
  document.getElementById("modal-save-btn").textContent = "Save Assignment";
  document.getElementById("f-title").value    = "";
  document.getElementById("f-desc").value     = "";
  document.getElementById("f-due").value      = "";
  document.getElementById("f-course").value   = "";
  document.getElementById("f-priority").value = "medium";
  document.getElementById("f-status").value   = "pending";
  document.getElementById("modal-error").textContent = "";
  openModal("assignment-modal");
  document.getElementById("f-title").focus();
}

document.getElementById("open-add-btn").addEventListener("click", openAdd);

// ── EDIT MODAL ────────────────────────────────────────────────────────────────

function openEdit(id) {
  const a = assignments.find(x => x.id === id);
  if (!a) return;
  editingId = id;
  document.getElementById("modal-title").textContent    = "Edit Assignment";
  document.getElementById("modal-save-btn").textContent = "Save Changes";
  document.getElementById("f-title").value    = a.title;
  document.getElementById("f-desc").value     = a.description || "";
  document.getElementById("f-due").value      = a.due_date ? a.due_date.substring(0, 10) : "";
  document.getElementById("f-course").value   = a.course_id || "";
  document.getElementById("f-priority").value = a.priority;
  document.getElementById("f-status").value   = a.status;
  document.getElementById("modal-error").textContent = "";
  openModal("assignment-modal");
  document.getElementById("f-title").focus();
}

// ── SAVE ──────────────────────────────────────────────────────────────────────

document.getElementById("modal-save-btn").addEventListener("click", async () => {
  const title    = document.getElementById("f-title").value.trim();
  const errorEl  = document.getElementById("modal-error");
  const btn      = document.getElementById("modal-save-btn");

  if (!title) { errorEl.textContent = "Title is required."; return; }
  errorEl.textContent = "";
  btn.disabled = true;

  const payload = {
    title,
    description: document.getElementById("f-desc").value.trim(),
    due_date:    document.getElementById("f-due").value   || null,
    course_id:   document.getElementById("f-course").value || null,
    priority:    document.getElementById("f-priority").value,
    status:      document.getElementById("f-status").value,
  };

  try {
    if (editingId) {
      await apiRequest(`/assignments/${editingId}`, "PUT", payload);
      showToast("Assignment updated.");
    } else {
      await apiRequest("/assignments", "POST", payload);
      showToast("Assignment added.");
    }
    closeModal("assignment-modal");
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
    await apiRequest(`/assignments/${deletingId}`, "DELETE");
    showToast("Assignment deleted.");
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
