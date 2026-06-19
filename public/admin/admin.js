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

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (!viewButton) return;
  if (viewButton.dataset.view === "media") renderMediaView().catch(showError);
});

async function renderMediaView() {
  viewTitle.textContent = "媒体库";
  viewBody.innerHTML = `
    <form id="uploadForm" class="panel">
      <input type="file" name="image" accept="image/*" required>
      <button type="submit">上传图片</button>
    </form>
    <p class="message" id="viewMessage"></p>
    <div id="mediaGrid" class="media-grid"></div>
  `;
  document.querySelector("#uploadForm").addEventListener("submit", uploadMedia);
  await loadMediaGrid();
}

async function loadMediaGrid() {
  const data = await api("/api/admin/media");
  document.querySelector("#mediaGrid").innerHTML = data.media.map((item) => `
    <article class="media-card">
      <img src="${item.url}" alt="${item.original_name}">
      <strong>${item.original_name}</strong>
      <code>${item.url}</code>
      <button data-delete-media="${item.id}">删除</button>
    </article>
  `).join("");
}

async function uploadMedia(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const response = await fetch("/api/admin/media", { method: "POST", body: formData });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Upload failed: ${response.status}`);
  event.currentTarget.reset();
  await loadMediaGrid();
}

document.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-media]");
  if (!deleteButton) return;
  try {
    await api(`/api/admin/media/${deleteButton.dataset.deleteMedia}`, { method: "DELETE" });
    await loadMediaGrid();
  } catch (error) {
    showError(error);
  }
});

function showError(error) {
  const message = document.querySelector("#viewMessage") || loginMessage;
  message.textContent = error.message;
}

checkSession().catch(() => {});
