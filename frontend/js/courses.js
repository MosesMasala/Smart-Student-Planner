// js/courses.js

requireLogin();
setupSidebar("courses");
loadNotifBadge();

let courses      = [];  // all courses from the API
let editingId    = null; // null = adding new, number = editing existing
let deletingId   = null; // the course being deleted

// ── LOAD & RENDER ─────────────────────────────────────────────────────────────

async function loadCourses() {
  try {
    courses = await apiRequest("/courses");
    renderGrid();
  } catch (err) {
    showToast("Could not load courses.", "error");
  }
}

function renderGrid() {
  const grid = document.getElementById("course-grid");

  if (!courses.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:60px 20px;">
        <div class="empty-icon">📖</div>
        <div class="empty-title">No courses yet</div>
        <div class="empty-desc">Add your first course to start organising your assignments.</div>
        <button class="btn btn-primary" style="margin-top:16px;" onclick="openAdd()">+ Add Course</button>
      </div>`;
    return;
  }

  grid.innerHTML = courses.map(c => `
    <div class="course-card">
      <div class="course-card-top">
        <div class="course-initial">${escHtml(c.name[0].toUpperCase())}</div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm btn-ghost btn-icon" title="Edit" onclick="openEdit(${c.id})">✏️</button>
          <button class="btn btn-sm btn-ghost btn-icon" title="Delete" onclick="openDelete(${c.id}, '${escAttr(c.name)}')">🗑️</button>
        </div>
      </div>
      <div class="course-name">${escHtml(c.name)}</div>
      <div class="course-desc">${c.description ? escHtml(c.description) : '<span style="color:var(--text-muted);font-style:italic;">No description</span>'}</div>
      <div class="course-footer">
        <span class="course-stat">Added ${formatDate(c.created_at)}</span>
        <a href="/assignments.html?course=${c.id}" class="btn btn-sm btn-ghost">View assignments →</a>
      </div>
    </div>`).join("");
}

// ── ADD MODAL ─────────────────────────────────────────────────────────────────

function openAdd() {
  editingId = null;
  document.getElementById("modal-title").textContent  = "Add Course";
  document.getElementById("modal-save-btn").textContent = "Save Course";
  document.getElementById("f-name").value = "";
  document.getElementById("f-desc").value = "";
  document.getElementById("modal-error").textContent = "";
  openModal("course-modal");
  document.getElementById("f-name").focus();
}

document.getElementById("open-add-btn").addEventListener("click", openAdd);

// ── EDIT MODAL ────────────────────────────────────────────────────────────────

function openEdit(id) {
  const course = courses.find(c => c.id === id);
  if (!course) return;
  editingId = id;
  document.getElementById("modal-title").textContent    = "Edit Course";
  document.getElementById("modal-save-btn").textContent = "Save Changes";
  document.getElementById("f-name").value = course.name;
  document.getElementById("f-desc").value = course.description || "";
  document.getElementById("modal-error").textContent = "";
  openModal("course-modal");
  document.getElementById("f-name").focus();
}

// ── SAVE (add or edit) ────────────────────────────────────────────────────────

document.getElementById("modal-save-btn").addEventListener("click", async () => {
  const name = document.getElementById("f-name").value.trim();
  const description = document.getElementById("f-desc").value.trim();
  const errorEl = document.getElementById("modal-error");
  const btn = document.getElementById("modal-save-btn");

  if (!name) { errorEl.textContent = "Course name is required."; return; }
  errorEl.textContent = "";
  btn.disabled = true;

  try {
    if (editingId) {
      await apiRequest(`/courses/${editingId}`, "PUT", { name, description });
      showToast("Course updated.");
    } else {
      await apiRequest("/courses", "POST", { name, description });
      showToast("Course added.");
    }
    closeModal("course-modal");
    loadCourses();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

// ── DELETE ────────────────────────────────────────────────────────────────────

function openDelete(id, name) {
  deletingId = id;
  document.getElementById("delete-course-name").textContent = name;
  openModal("delete-modal");
}

document.getElementById("confirm-delete-btn").addEventListener("click", async () => {
  if (!deletingId) return;
  const btn = document.getElementById("confirm-delete-btn");
  btn.disabled = true;
  try {
    await apiRequest(`/courses/${deletingId}`, "DELETE");
    showToast("Course deleted.");
    closeModal("delete-modal");
    deletingId = null;
    loadCourses();
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
loadCourses();
