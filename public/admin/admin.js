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
  if (viewButton.dataset.view === "home") renderHomeModulesView().catch(showError);
});

async function renderMediaView() {
  viewTitle.textContent = "媒体库";
  viewBody.innerHTML = `
    <div class="section-toolbar">
      <h3>新增图片</h3>
    </div>
    <form id="uploadForm" class="panel">
      <input name="title" placeholder="图片标题" required>
      <input type="file" name="image" accept="image/*" required>
      <button type="submit">上传图片</button>
    </form>
    <form id="mediaEditForm" class="editor-form media-edit-form" hidden>
      <h3 id="mediaEditTitle">编辑图片</h3>
      <input name="id" type="hidden">
      <label>标题<input name="title" required></label>
      <label>替换图片<input type="file" name="image" accept="image/*"></label>
      <div class="form-actions">
        <button type="submit" data-update-media>保存图片</button>
        <button class="secondary-button" type="button" data-cancel-media-edit>取消</button>
      </div>
    </form>
    <p class="message" id="viewMessage"></p>
    <div id="mediaGrid" class="media-grid"></div>
  `;
  document.querySelector("#uploadForm").addEventListener("submit", uploadMedia);
  document.querySelector("#mediaEditForm").addEventListener("submit", updateMedia);
  await loadMediaGrid();
}

async function loadMediaGrid() {
  const data = await api("/api/admin/media");
  document.querySelector("#mediaGrid").innerHTML = data.media.map((item) => `
    <article class="media-card">
      <img src="${item.url}" alt="${item.original_name}">
      <strong>${item.original_name}</strong>
      <code>${item.url}</code>
      <div class="record-actions">
        <button type="button" data-edit-media="${item.id}">编辑</button>
        <button type="button" data-delete-media="${item.id}">删除</button>
      </div>
      <script type="application/json" data-media-json="${item.id}">${JSON.stringify(item).replace(/</g, "\\u003c")}</script>
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

async function updateMedia(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id.value;
  const formData = new FormData(form);
  if (!form.elements.image.files.length) formData.delete("image");
  const response = await fetch(`/api/admin/media/${id}`, { method: "PUT", body: formData });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Update failed: ${response.status}`);
  form.hidden = true;
  form.reset();
  await loadMediaGrid();
}

function fillMediaEditForm(media) {
  const form = document.querySelector("#mediaEditForm");
  form.hidden = false;
  form.elements.id.value = media.id;
  form.elements.title.value = media.original_name;
  form.elements.image.value = "";
  document.querySelector("#mediaEditTitle").textContent = `编辑图片：${media.original_name}`;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit-media]");
  if (editButton) {
    const script = document.querySelector(`[data-media-json="${editButton.dataset.editMedia}"]`);
    fillMediaEditForm(JSON.parse(script.textContent));
    return;
  }

  const cancelButton = event.target.closest("[data-cancel-media-edit]");
  if (cancelButton) {
    const form = document.querySelector("#mediaEditForm");
    form.hidden = true;
    form.reset();
    return;
  }

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

function renderMediaOptions(media) {
  return media.map((item) => `
    <option value="${item.id}" data-url="${item.url}">${item.original_name}</option>
  `).join("");
}

async function renderProductsView() {
  viewTitle.textContent = "商品管理";
  const [productsData, mediaData] = await Promise.all([
    api("/api/admin/products"),
    api("/api/admin/media")
  ]);
  viewBody.innerHTML = `
    <p class="message" id="viewMessage"></p>
    <div class="section-toolbar">
      <h3>商品列表</h3>
      <button type="button" data-new-product>新增商品</button>
    </div>
    <div class="split-editor">
      <div id="productsList" class="record-list"></div>
      <form id="productForm" class="editor-form">
        <h3 id="productFormTitle">新增商品</h3>
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
        <section class="image-editor">
          <div id="productImagePreview" class="image-preview image-preview-empty">未选择图片</div>
          <label>更换商品图片
            <select name="mainImageId">
              <option value="">无图</option>
              ${renderMediaOptions(mediaData.media)}
            </select>
          </label>
          <button class="secondary-button" type="button" data-open-media>去媒体库上传/编辑图片</button>
        </section>
        <label>排序<input name="sortOrder" type="number" value="0"></label>
        <label class="checkbox"><input name="visible" type="checkbox" checked> 显示</label>
        <div class="form-actions">
          <button type="submit">保存商品</button>
          <button class="secondary-button" type="button" data-new-product>清空新增</button>
        </div>
      </form>
    </div>
  `;
  renderProductsList(productsData.products);
  document.querySelector("#productForm").addEventListener("submit", saveProduct);
  document.querySelector("#productForm").elements.mainImageId.addEventListener("change", updateProductImagePreview);
  updateProductImagePreview();
}

function renderProductsList(products) {
  document.querySelector("#productsList").innerHTML = products.map((product) => `
    <article class="record-row">
      <div class="record-edit">
        ${product.image_url
          ? `<img class="record-thumb" src="${product.image_url}" alt="${product.name}">`
          : `<span class="record-thumb record-thumb-empty">无图</span>`}
        <span class="record-copy">
          <strong>${product.name}</strong>
          <span>${product.category} / $${product.price}</span>
        </span>
      </div>
      <div class="record-actions">
        <button type="button" data-edit-product="${product.id}">编辑</button>
        <button type="button" data-delete-product="${product.id}">删除</button>
      </div>
      <script type="application/json" data-product-json="${product.id}">${JSON.stringify(product).replace(/</g, "\\u003c")}</script>
    </article>
  `).join("");
}

function resetProductForm() {
  const form = document.querySelector("#productForm");
  form.reset();
  form.elements.id.value = "";
  form.elements.badge.value = "Carry";
  form.elements.tone.value = "tone-graphite";
  form.elements.mainImageId.value = "";
  form.elements.sortOrder.value = "0";
  form.elements.visible.checked = true;
  document.querySelector("#productFormTitle").textContent = "新增商品";
  updateProductImagePreview();
}

function updateProductImagePreview() {
  const form = document.querySelector("#productForm");
  const preview = document.querySelector("#productImagePreview");
  if (!form || !preview) return;

  const option = form.elements.mainImageId.selectedOptions[0];
  const imageUrl = option?.dataset.url || "";
  if (!imageUrl) {
    preview.className = "image-preview image-preview-empty";
    preview.textContent = "未选择图片";
    return;
  }

  preview.className = "image-preview";
  preview.innerHTML = `<img src="${imageUrl}" alt="${option.textContent}">`;
}

function fillProductForm(product) {
  const form = document.querySelector("#productForm");
  document.querySelector("#productFormTitle").textContent = `编辑商品：${product.name}`;
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
  updateProductImagePreview();
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
  const newButton = event.target.closest("[data-new-product]");
  if (newButton) {
    resetProductForm();
    return;
  }

  const openMediaButton = event.target.closest("[data-open-media]");
  if (openMediaButton) {
    renderMediaView().catch(showError);
    return;
  }

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

async function renderHomeModulesView() {
  viewTitle.textContent = "首页模块";
  const [modulesData, mediaData] = await Promise.all([
    api("/api/admin/home-modules"),
    api("/api/admin/media")
  ]);
  viewBody.innerHTML = `
    <p class="message" id="viewMessage"></p>
    <div class="section-toolbar">
      <h3>首页模块列表</h3>
      <button type="button" data-new-home-module>新增模块</button>
    </div>
    <div class="split-editor">
      <div id="homeModulesList" class="record-list"></div>
      <form id="homeModuleForm" class="editor-form">
        <h3 id="homeModuleFormTitle">新增模块</h3>
        <input name="id" type="hidden">
        <label>模块类型
          <select name="moduleType">
            <option value="brand_logo">品牌 Logo</option>
            <option value="image_category">分类图片</option>
          </select>
        </label>
        <label>标题<input name="title" required></label>
        <label>图片<select name="imageId"><option value="">无</option>${mediaData.media.map((item) => `<option value="${item.id}">${item.original_name}</option>`).join("")}</select></label>
        <label>链接<input name="linkUrl" value="#related" required></label>
        <label>排序<input name="sortOrder" type="number" value="0"></label>
        <label class="checkbox"><input name="visible" type="checkbox" checked> 显示</label>
        <div class="form-actions">
          <button type="submit">保存模块</button>
          <button class="secondary-button" type="button" data-new-home-module>清空新增</button>
        </div>
      </form>
    </div>
  `;
  renderHomeModulesList(modulesData.modules);
  document.querySelector("#homeModuleForm").addEventListener("submit", saveHomeModule);
}

function renderHomeModulesList(modules) {
  document.querySelector("#homeModulesList").innerHTML = modules.map((module) => `
    <article class="record-row">
      <div class="record-edit">
        ${module.image_url
          ? `<img class="record-thumb" src="${module.image_url}" alt="${module.title}">`
          : `<span class="record-thumb record-thumb-empty">无图</span>`}
        <span class="record-copy">
          <strong>${module.title}</strong>
          <span>${module.module_type} / ${module.link_url}</span>
        </span>
      </div>
      <div class="record-actions">
        <button type="button" data-edit-home-module="${module.id}">编辑</button>
        <button type="button" data-delete-home-module="${module.id}">删除</button>
      </div>
      <script type="application/json" data-home-module-json="${module.id}">${JSON.stringify(module).replace(/</g, "\\u003c")}</script>
    </article>
  `).join("");
}

function resetHomeModuleForm() {
  const form = document.querySelector("#homeModuleForm");
  form.reset();
  form.elements.id.value = "";
  form.elements.linkUrl.value = "#related";
  form.elements.sortOrder.value = "0";
  form.elements.visible.checked = true;
  document.querySelector("#homeModuleFormTitle").textContent = "新增模块";
}

function fillHomeModuleForm(module) {
  const form = document.querySelector("#homeModuleForm");
  document.querySelector("#homeModuleFormTitle").textContent = `编辑模块：${module.title}`;
  form.elements.id.value = module.id;
  form.elements.moduleType.value = module.module_type;
  form.elements.title.value = module.title;
  form.elements.imageId.value = module.image_id || "";
  form.elements.linkUrl.value = module.link_url;
  form.elements.sortOrder.value = module.sort_order;
  form.elements.visible.checked = Boolean(module.visible);
}

function readHomeModuleForm(form) {
  return {
    moduleType: form.elements.moduleType.value,
    title: form.elements.title.value,
    imageId: form.elements.imageId.value,
    linkUrl: form.elements.linkUrl.value,
    sortOrder: form.elements.sortOrder.value,
    visible: form.elements.visible.checked
  };
}

async function saveHomeModule(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id.value;
  await api(id ? `/api/admin/home-modules/${id}` : "/api/admin/home-modules", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(readHomeModuleForm(form))
  });
  await renderHomeModulesView();
}

document.addEventListener("click", async (event) => {
  const newButton = event.target.closest("[data-new-home-module]");
  if (newButton) {
    resetHomeModuleForm();
    return;
  }

  const editButton = event.target.closest("[data-edit-home-module]");
  if (editButton) {
    const script = document.querySelector(`[data-home-module-json="${editButton.dataset.editHomeModule}"]`);
    fillHomeModuleForm(JSON.parse(script.textContent));
    return;
  }

  const deleteButton = event.target.closest("[data-delete-home-module]");
  if (!deleteButton) return;
  try {
    await api(`/api/admin/home-modules/${deleteButton.dataset.deleteHomeModule}`, { method: "DELETE" });
    await renderHomeModulesView();
  } catch (error) {
    showError(error);
  }
});

checkSession().catch(() => {});
