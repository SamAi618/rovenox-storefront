const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const viewTitle = document.querySelector("#viewTitle");
const viewBody = document.querySelector("#viewBody");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  viewTitle.textContent = "概览";
  viewBody.innerHTML = "<p>请选择左侧功能。</p>";
}

async function checkSession() {
  const session = await api("/api/admin/session");
  if (session.authenticated) showDashboard();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password")
      })
    });
    showDashboard();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  location.reload();
});

checkSession().catch(() => {});
