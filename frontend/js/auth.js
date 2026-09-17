// js/auth.js — handles the login and register forms

const loginForm    = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

// ── LOGIN ─────────────────────────────────────────────────────────────────────

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("error-msg");
    const submitBtn = document.getElementById("submit-btn");
    errorEl.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in…";

    try {
      const data = await apiRequest("/auth/login", "POST", {
        email:    document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      window.location.href = "/dashboard.html";
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = "Log In";
    }
  });
}

// ── REGISTER ──────────────────────────────────────────────────────────────────

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl  = document.getElementById("error-msg");
    const submitBtn = document.getElementById("submit-btn");
    errorEl.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account…";

    try {
      const data = await apiRequest("/auth/register", "POST", {
        name:     document.getElementById("name").value.trim(),
        email:    document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(data.user));
      window.location.href = "/dashboard.html";
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
    }
  });
}
