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
  if (viewButton.dataset.view === "products") renderProductsView().catch(showError);
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

function parseJsonList(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(", ") : "";
  } catch {
    return "";
  }
}

async function renderProductsView() {
  viewTitle.textContent = "商品管理";
  const [productsData, mediaData] = await Promise.all([
    api("/api/admin/products"),
    api("/api/admin/media")
  ]);
  viewBody.innerHTML = `
    <p class="message" id="viewMessage"></p>
    <div class="split-editor">
      <div id="productsList" class="record-list"></div>
      <form id="productForm" class="editor-form">
        <input name="id" type="hidden">
        <label>Slug<input name="slug" required></label>
        <label>名称<input name="name" required></label>
        <label>分类<input name="category" required></label>
        <label>价格<input name="price" type="number" required></label>
        <label>描述<textarea name="description" required></textarea></label>
        <label>颜色<input name="colors" placeholder="Black, White"></label>
        <label>尺码<input name="sizes" placeholder="7, 8, 9"></label>
        <label>Badge<input name="badge" value="Carry"></label>
        <label>Tone<input name="tone" value="tone-graphite"></label>
        <label>主图<select name="mainImageId"><option value="">无</option>${mediaData.media.map((item) => `<option value="${item.id}">${item.original_name}</option>`).join("")}</select></label>
        <label>排序<input name="sortOrder" type="number" value="0"></label>
        <label class="checkbox"><input name="visible" type="checkbox" checked> 显示</label>
        <button type="submit">保存商品</button>
      </form>
    </div>
  `;
  renderProductsList(productsData.products);
  document.querySelector("#productForm").addEventListener("submit", saveProduct);
}

function renderProductsList(products) {
  document.querySelector("#productsList").innerHTML = products.map((product) => `
    <article class="record-row">
      <button type="button" data-edit-product="${product.id}">
        <strong>${product.name}</strong>
        <span>${product.category} / $${product.price}</span>
      </button>
      <button type="button" data-delete-product="${product.id}">删除</button>
      <script type="application/json" data-product-json="${product.id}">${JSON.stringify(product).replace(/</g, "\\u003c")}</script>
    </article>
  `).join("");
}

function fillProductForm(product) {
  const form = document.querySelector("#productForm");
  form.elements.id.value = product.id;
  form.elements.slug.value = product.slug;
  form.elements.name.value = product.name;
  form.elements.category.value = product.category;
  form.elements.price.value = product.price;
  form.elements.description.value = product.description;
  form.elements.colors.value = parseJsonList(product.colors_json);
  form.elements.sizes.value = parseJsonList(product.sizes_json);
  form.elements.badge.value = product.badge;
  form.elements.tone.value = product.tone;
  form.elements.mainImageId.value = product.main_image_id || "";
  form.elements.sortOrder.value = product.sort_order;
  form.elements.visible.checked = Boolean(product.visible);
}

function readProductForm(form) {
  return {
    slug: form.elements.slug.value,
    name: form.elements.name.value,
    category: form.elements.category.value,
    price: form.elements.price.value,
    description: form.elements.description.value,
    colors: form.elements.colors.value,
    sizes: form.elements.sizes.value,
    badge: form.elements.badge.value,
    tone: form.elements.tone.value,
    mainImageId: form.elements.mainImageId.value,
    sortOrder: form.elements.sortOrder.value,
    visible: form.elements.visible.checked
  };
}

async function saveProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id.value;
  await api(id ? `/api/admin/products/${id}` : "/api/admin/products", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(readProductForm(form))
  });
  await renderProductsView();
}

document.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-product]");
  if (editButton) {
    const script = document.querySelector(`[data-product-json="${editButton.dataset.editProduct}"]`);
    fillProductForm(JSON.parse(script.textContent));
    return;
  }

  const deleteButton = event.target.closest("[data-delete-product]");
  if (!deleteButton) return;
  try {
    await api(`/api/admin/products/${deleteButton.dataset.deleteProduct}`, { method: "DELETE" });
    await renderProductsView();
  } catch (error) {
    showError(error);
  }
});

checkSession().catch(() => {});
