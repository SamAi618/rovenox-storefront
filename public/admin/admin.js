const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const viewTitle = document.querySelector("#viewTitle");
const viewBody = document.querySelector("#viewBody");
let productImageUploadInProgress = false;

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
      <input type="file" name="image" accept="image/*,video/*" required>
      <button type="submit">上传媒体</button>
    </form>
    <form id="mediaEditForm" class="editor-form media-edit-form" hidden>
      <h3 id="mediaEditTitle">编辑图片</h3>
      <input name="id" type="hidden">
      <label>标题<input name="title" required></label>
      <label>替换媒体<input type="file" name="image" accept="image/*,video/*"></label>
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
      ${mediaPreviewMarkup({
        url: item.url,
        title: item.original_name,
        mimeType: item.mime_type
      })}
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

function showViewMessage(text) {
  const message = document.querySelector("#viewMessage") || loginMessage;
  if (message) message.textContent = text;
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
    <option value="${item.id}" data-url="${item.url}" data-mime-type="${item.mime_type}">${item.original_name}</option>
  `).join("");
}

const brandCategoryOptions = {
  shoes: ["Air Jordan", "Nike", "Sacai", "Adidas", "Travis Scot", "Designer Shoes"],
  bags: [
    "CHANEL",
    "LOUIS VUITTON",
    "New products",
    "BACKPACK",
    "DIOR",
    "GUCCI",
    "CELINE",
    "FENDI",
    "BOTTEGA VENETA",
    "PRADA",
    "THEIR PLANE",
    "BALENCIAGA",
    "GOYARD",
    "MIU MIU",
    "Yves Saint Laurent",
    "LOEWE",
    "BURBERRY",
    "HERMES",
    "GIVENCHY",
    "THE ROW",
    "LUGGAGE BAG"
  ],
  watches: [
    "Vacheron Constantin",
    "Richard Mille",
    "Cartier",
    "IWC",
    "OMEGA",
    "Rolex",
    "Tag Heuer",
    "Breitling",
    "Patek Philippe",
    "Audemars Piguet"
  ]
};

function renderBrandCategoryOptions(category) {
  return (brandCategoryOptions[category] || []).map((item) => `<option value="${item}">${item}</option>`).join("");
}

function formatAdminPrice(price) {
  const value = String(price || "").trim();
  const range = value.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) return `$${Number(range[1]).toLocaleString("en-US")}-$${Number(range[2]).toLocaleString("en-US")}`;
  const number = Number(value);
  return Number.isFinite(number) ? `$${number.toLocaleString("en-US")}` : value;
}

function mediaPreviewMarkup({ url, title = "", mimeType = "", className = "" }) {
  if (!url) return "";
  const safeTitle = title.replace(/"/g, "&quot;");
  const classAttribute = className ? ` class="${className}"` : "";
  if (mimeType.startsWith("video/")) {
    return `<video${classAttribute} src="${url}" aria-label="${safeTitle}" muted loop playsinline controls></video>`;
  }
  return `<img${classAttribute} src="${url}" alt="${safeTitle}">`;
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
        <input name="productMediaIds" type="hidden" value="[]">
        <label>Slug<input name="slug" required></label>
        <label>名称<input name="name" required></label>
        <label>分类
          <select name="category" required>
            <option value="shoes">SHOES</option>
            <option value="bags">BAGS</option>
            <option value="watches">WATCHES</option>
          </select>
        </label>
        <label>价格<input name="price" inputmode="numeric" placeholder="200 或 200-700" required></label>
        <label>描述<textarea name="description" required></textarea></label>
        <label>颜色<input name="colors" placeholder="Black, White"></label>
        <label>尺码<input name="sizes" placeholder="7, 8, 9"></label>
        <label>品牌分类
          <select name="badge" required>
            ${renderBrandCategoryOptions("shoes")}
          </select>
        </label>
        <div class="inline-actions">
          <button class="secondary-button" type="button" data-custom-brand-category>自定义输入类目</button>
        </div>
        <label id="customBrandCategoryField" hidden>自定义品牌分类
          <input name="customBadge" placeholder="输入自定义类目">
        </label>
        <label>Tone<input name="tone" value="tone-graphite"></label>
        <section class="image-editor">
          <div id="productImagePreview" class="image-preview image-preview-empty">未选择媒体</div>
          <label class="media-select-field">商品主图/视频
            <select name="mainImageId">
              <option value="">无图</option>
              ${renderMediaOptions(mediaData.media)}
            </select>
          </label>
          <label>本地上传图片/视频
            <input type="file" name="productImageUpload" accept="image/*,video/*" multiple="multiple">
          </label>
          <div class="inline-actions">
            <button class="secondary-button" type="button" data-upload-product-image>本地上传并使用</button>
            <span class="inline-message" id="productImageUploadStatus"></span>
          </div>
          <button class="secondary-button" type="button" data-open-media>去媒体库上传/编辑媒体</button>
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
  document.querySelector("#productForm").elements.category.addEventListener("change", () => {
    document.querySelector("#customBrandCategoryField").hidden = true;
    document.querySelector("#productForm").elements.customBadge.value = "";
    syncBrandCategoryOptions();
  });
  document.querySelector("#productForm").elements.mainImageId.addEventListener("change", (event) => {
    setPrimaryProductMedia(event.currentTarget.value);
    updateProductImagePreview();
  });
  document.querySelector("#productForm").elements.productImageUpload.multiple = true;
  syncBrandCategoryOptions();
  updateProductImagePreview();
}

function renderProductsList(products) {
  document.querySelector("#productsList").innerHTML = products.map((product) => `
    <article class="record-row">
      <div class="record-edit">
        ${product.image_url
          ? mediaPreviewMarkup({
            url: product.image_url,
            title: product.name,
            mimeType: product.media_mime_type || "",
            className: "record-thumb"
          })
          : `<span class="record-thumb record-thumb-empty">无图</span>`}
        <span class="record-copy">
          <strong>${product.name}</strong>
          <span>${product.category} / ${product.badge} / ${formatAdminPrice(product.price)}</span>
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
  form.elements.category.value = "shoes";
  form.elements.tone.value = "tone-graphite";
  form.elements.mainImageId.value = "";
  setProductMediaIds([]);
  form.elements.sortOrder.value = "0";
  form.elements.visible.checked = true;
  document.querySelector("#customBrandCategoryField").hidden = true;
  document.querySelector("#productFormTitle").textContent = "新增商品";
  syncBrandCategoryOptions();
  updateProductImagePreview();
}

function syncBrandCategoryOptions(selectedValue = "") {
  const form = document.querySelector("#productForm");
  if (!form) return;
  const select = form.elements.badge;
  const category = form.elements.category.value || "shoes";
  const options = brandCategoryOptions[category] || [];
  select.innerHTML = renderBrandCategoryOptions(category);
  select.value = options.includes(selectedValue) ? selectedValue : options[0] || "";
}

function showCustomBrandCategory(value = "") {
  const field = document.querySelector("#customBrandCategoryField");
  const form = document.querySelector("#productForm");
  field.hidden = false;
  form.elements.customBadge.value = value;
  form.elements.customBadge.focus();
}

function updateProductImagePreview() {
  const form = document.querySelector("#productForm");
  const preview = document.querySelector("#productImagePreview");
  if (!form || !preview) return;

  const mediaIds = getProductMediaIds();
  if (!mediaIds.length) {
    preview.className = "image-preview image-preview-empty";
    preview.textContent = "未选择媒体";
    return;
  }

  preview.className = "image-preview";
  preview.innerHTML = `
    <div class="product-media-strip" data-product-media-strip>
      <div class="product-media-primary-drop" data-primary-product-drop>拖到这里设为主图</div>
      ${mediaIds.map((mediaId, index) => {
        const media = productMediaById(mediaId);
        if (!media) return "";
        return `
          <button
            class="product-media-preview ${index === 0 ? "active" : ""}"
            type="button"
            data-preview-product-media="${media.id}"
            draggable="true"
            data-draggable-product-media="${media.id}"
            aria-label="${index === 0 ? "主图" : "商品图片"}：拖动调整顺序"
          >
            <span class="media-primary-label">${index === 0 ? "主图" : "设为主图"}</span>
            <span class="media-remove-button" role="button" tabindex="0" data-remove-product-media="${media.id}" aria-label="删除媒体">×</span>
            ${mediaPreviewMarkup({
              url: media.url,
              title: media.original_name,
              mimeType: media.mime_type
            })}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function addMediaSelectOption(select, media) {
  const option = new Option(media.original_name, media.id);
  option.dataset.url = media.url;
  option.dataset.mimeType = media.mime_type;
  select.add(option);
}

function getProductMediaIds() {
  const form = document.querySelector("#productForm");
  try {
    const parsed = JSON.parse(form.elements.productMediaIds.value || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function setProductMediaIds(mediaIds) {
  const form = document.querySelector("#productForm");
  form.elements.productMediaIds.value = JSON.stringify(Array.from(new Set(mediaIds.map(String))));
}

function syncProductMainImageFromMediaIds() {
  const form = document.querySelector("#productForm");
  const mediaIds = getProductMediaIds();
  form.elements.mainImageId.value = mediaIds[0] || "";
}

function productMediaById(mediaId) {
  const option = document.querySelector(`#productForm select[name="mainImageId"] option[value="${mediaId}"]`);
  if (!option) return null;
  return {
    id: String(mediaId),
    url: option.dataset.url,
    mime_type: option.dataset.mimeType || "",
    original_name: option.textContent
  };
}

function setPrimaryProductMedia(mediaId) {
  if (!mediaId) return;
  const nextMediaIds = getProductMediaIds().filter((id) => id !== String(mediaId));
  setProductMediaIds([String(mediaId), ...nextMediaIds]);
  syncProductMainImageFromMediaIds();
}

function removeProductMedia(mediaId) {
  const nextMediaIds = getProductMediaIds().filter((id) => id !== String(mediaId));
  setProductMediaIds(nextMediaIds);
  syncProductMainImageFromMediaIds();
  updateProductImagePreview();
}

function reorderProductMedia(draggedMediaId, targetMediaId) {
  if (!draggedMediaId || !targetMediaId || draggedMediaId === targetMediaId) return;
  const mediaIds = getProductMediaIds();
  const draggedIndex = mediaIds.indexOf(String(draggedMediaId));
  const targetIndex = mediaIds.indexOf(String(targetMediaId));
  if (draggedIndex === -1 || targetIndex === -1) return;

  const nextMediaIds = [...mediaIds];
  const [draggedId] = nextMediaIds.splice(draggedIndex, 1);
  nextMediaIds.splice(targetIndex, 0, draggedId);
  setProductMediaIds(nextMediaIds);
  syncProductMainImageFromMediaIds();
  updateProductImagePreview();
}

function openProductMediaLightbox(mediaId) {
  const media = productMediaById(mediaId);
  if (!media) return;
  document.querySelector("#productMediaLightbox")?.remove();
  document.body.insertAdjacentHTML("beforeend", `
    <div class="media-lightbox" id="productMediaLightbox" role="dialog" aria-modal="true">
      <button type="button" class="media-lightbox-close" data-close-product-media>关闭</button>
      ${mediaPreviewMarkup({
        url: media.url,
        title: media.original_name,
        mimeType: media.mime_type
      })}
    </div>
  `);
}

async function uploadProductImage(event, uploadButton = null) {
  event.preventDefault();
  if (productImageUploadInProgress) return;
  const form = document.querySelector("#productForm");
  const fileInput = form.elements.productImageUpload;
  const status = document.querySelector("#productImageUploadStatus");
  const mediaFiles = Array.from(fileInput.files);

  if (!mediaFiles.length) {
    status.textContent = "请选择本地图片或视频";
    return;
  }

  productImageUploadInProgress = true;
  if (uploadButton) uploadButton.disabled = true;
  status.textContent = "上传中...";
  try {
    let firstMediaId = "";
    const uploadedMediaIds = [];
    for (const [index, mediaFile] of mediaFiles.entries()) {
      status.textContent = `上传中 ${index + 1}/${mediaFiles.length}...`;
      const uploadFormData = new FormData();
      uploadFormData.append("title", form.elements.name.value || mediaFile.name);
      uploadFormData.append("image", mediaFile);

      const response = await fetch("/api/admin/media", { method: "POST", body: uploadFormData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Upload failed: ${response.status}`);

      addMediaSelectOption(form.elements.mainImageId, data.media);
      uploadedMediaIds.push(String(data.media.id));
      if (!firstMediaId) firstMediaId = String(data.media.id);
    }
    const existingMediaIds = getProductMediaIds().filter((mediaId) => !uploadedMediaIds.includes(mediaId));
    setProductMediaIds([firstMediaId, ...existingMediaIds, ...uploadedMediaIds.filter((mediaId) => mediaId !== firstMediaId)]);
    syncProductMainImageFromMediaIds();
    fileInput.value = "";
    status.textContent = `已上传 ${mediaFiles.length} 个文件，并选中第一个`;
    updateProductImagePreview();
  } finally {
    productImageUploadInProgress = false;
    if (uploadButton) uploadButton.disabled = false;
  }
}

function fillProductForm(product) {
  const form = document.querySelector("#productForm");
  document.querySelector("#productFormTitle").textContent = `编辑商品：${product.name}`;
  form.elements.id.value = product.id;
  form.elements.slug.value = product.slug;
  form.elements.name.value = product.name;
  form.elements.category.value = product.category;
  syncBrandCategoryOptions(product.badge);
  if (form.elements.badge.value !== product.badge) showCustomBrandCategory(product.badge);
  form.elements.price.value = product.price;
  form.elements.description.value = product.description;
  form.elements.colors.value = parseJsonList(product.colors_json);
  form.elements.sizes.value = parseJsonList(product.sizes_json);
  form.elements.tone.value = product.tone;
  form.elements.mainImageId.value = product.main_image_id || "";
  setProductMediaIds(product.media?.length ? product.media.map((media) => media.id) : []);
  if (!getProductMediaIds().length && product.main_image_id) setProductMediaIds([product.main_image_id]);
  form.elements.sortOrder.value = product.sort_order;
  form.elements.visible.checked = Boolean(product.visible);
  updateProductImagePreview();
}

function readProductForm(form) {
  const customBadge = form.elements.customBadge.value.trim();
  const mainImageId = form.elements.mainImageId.value;
  const productMediaIds = mainImageId
    ? [mainImageId, ...getProductMediaIds().filter((mediaId) => mediaId !== mainImageId)]
    : getProductMediaIds();
  return {
    slug: form.elements.slug.value,
    name: form.elements.name.value,
    category: form.elements.category.value,
    price: form.elements.price.value,
    description: form.elements.description.value,
    colors: form.elements.colors.value,
    sizes: form.elements.sizes.value,
    badge: customBadge || form.elements.badge.value,
    tone: form.elements.tone.value,
    mainImageId,
    productMediaIds,
    sortOrder: form.elements.sortOrder.value,
    visible: form.elements.visible.checked
  };
}

async function saveProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id.value;
  const submitButton = form.querySelector("button[type='submit']");
  if (productImageUploadInProgress) {
    showViewMessage("图片仍在上传，请等待上传完成后再保存商品。");
    return;
  }
  showViewMessage("");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "保存中...";
  }
  try {
    await api(id ? `/api/admin/products/${id}` : "/api/admin/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(readProductForm(form))
    });
    await renderProductsView();
  } catch (error) {
    showError(error);
    if (error.message.includes("Slug")) {
      form.elements.slug.focus();
      form.elements.slug.select();
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "保存商品";
    }
  }
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

  const uploadImageButton = event.target.closest("[data-upload-product-image]");
  if (uploadImageButton) {
    uploadProductImage(event, uploadImageButton).catch(showError);
    return;
  }

  const removeMediaButton = event.target.closest("[data-remove-product-media]");
  if (removeMediaButton) {
    event.preventDefault();
    event.stopPropagation();
    removeProductMedia(removeMediaButton.dataset.removeProductMedia);
    return;
  }

  const customBrandButton = event.target.closest("[data-custom-brand-category]");
  if (customBrandButton) {
    showCustomBrandCategory();
    return;
  }

  const previewMediaButton = event.target.closest("[data-preview-product-media]");
  if (previewMediaButton) {
    setPrimaryProductMedia(previewMediaButton.dataset.previewProductMedia);
    updateProductImagePreview();
    return;
  }

  const closeProductMediaButton = event.target.closest("[data-close-product-media]");
  if (closeProductMediaButton) {
    document.querySelector("#productMediaLightbox")?.remove();
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

document.addEventListener("dragstart", (event) => {
  const preview = event.target.closest("[data-draggable-product-media]");
  if (!preview) return;
  preview.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", preview.dataset.draggableProductMedia);
});

document.addEventListener("dragover", (event) => {
  const dropTarget = event.target.closest("[data-draggable-product-media], [data-primary-product-drop]");
  if (!dropTarget) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
});

document.addEventListener("drop", (event) => {
  const primaryDrop = event.target.closest("[data-primary-product-drop]");
  if (primaryDrop) {
    event.preventDefault();
    setPrimaryProductMedia(event.dataTransfer.getData("text/plain"));
    updateProductImagePreview();
    return;
  }
  const preview = event.target.closest("[data-draggable-product-media]");
  if (!preview) return;
  event.preventDefault();
  reorderProductMedia(event.dataTransfer.getData("text/plain"), preview.dataset.draggableProductMedia);
});

document.addEventListener("dragend", () => {
  document.querySelectorAll("[data-draggable-product-media].dragging").forEach((preview) => {
    preview.classList.remove("dragging");
  });
});

async function renderHomeModulesView() {
  viewTitle.textContent = "品牌 Logo";
  const [modulesData, mediaData] = await Promise.all([
    api("/api/admin/home-modules"),
    api("/api/admin/media")
  ]);
  const brandLogoModules = modulesData.modules.filter((module) => module.module_type === "brand_logo");
  viewBody.innerHTML = `
    <p class="message" id="viewMessage"></p>
    <div class="section-toolbar">
      <h3>品牌 Logo 列表</h3>
      <button type="button" data-new-home-module>新增 Logo</button>
    </div>
    <div class="split-editor">
      <div id="homeModulesList" class="record-list"></div>
      <form id="homeModuleForm" class="editor-form" hidden>
        <h3 id="homeModuleFormTitle">新增 Logo</h3>
        <input name="id" type="hidden">
        <input name="moduleType" type="hidden" value="brand_logo">
        <label>标题<input name="title" required></label>
        <label>图片<select name="imageId"><option value="">无</option>${mediaData.media.map((item) => `<option value="${item.id}">${item.original_name}</option>`).join("")}</select></label>
        <label>链接<input name="linkUrl" value="#related" required></label>
        <label>排序<input name="sortOrder" type="number" value="0"></label>
        <label class="checkbox"><input name="visible" type="checkbox" checked> 显示</label>
        <div class="form-actions">
          <button type="submit">保存 Logo</button>
          <button class="secondary-button" type="button" data-new-home-module>清空新增</button>
        </div>
      </form>
    </div>
  `;
  renderHomeModulesList(brandLogoModules);
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
  form.elements.moduleType.value = "brand_logo";
  document.querySelector("#homeModuleFormTitle").textContent = "新增 Logo";
  openHomeModuleForm();
}

function openHomeModuleForm() {
  const form = document.querySelector("#homeModuleForm");
  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fillHomeModuleForm(module) {
  const form = document.querySelector("#homeModuleForm");
  openHomeModuleForm();
  document.querySelector("#homeModuleFormTitle").textContent = `编辑 Logo：${module.title}`;
  form.elements.id.value = module.id;
  form.elements.moduleType.value = "brand_logo";
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
