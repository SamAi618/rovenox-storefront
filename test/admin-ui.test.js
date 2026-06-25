import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { projectRoot } from "../server/paths.js";

const adminScript = readFileSync(path.join(projectRoot, "public/admin/admin.js"), "utf8");
const adminStyles = readFileSync(path.join(projectRoot, "public/admin/admin.css"), "utf8");

test("product management rows render product thumbnails", () => {
  assert.match(adminScript, /class="record-thumb"/);
  assert.match(adminScript, /product\.image_url/);
});

test("media library keeps image previews fully visible inside cards", () => {
  assert.match(adminStyles, /\.media-card\s*\{[^}]*min-width:\s*0;/s);
  assert.match(adminStyles, /\.media-card img,\s*\.media-card video\s*\{[^}]*object-fit:\s*contain;/s);
  assert.match(adminStyles, /\.media-card strong\s*,\s*\.record-copy\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
});

test("admin sections expose explicit create and edit controls", () => {
  assert.match(adminScript, /data-new-product/);
  assert.match(adminScript, /data-new-home-module/);
  assert.match(adminScript, /data-edit-product/);
  assert.match(adminScript, /data-edit-home-module/);
  assert.match(adminScript, />编辑</);
});

test("home module rows render image thumbnails", () => {
  assert.match(adminScript, /module\.image_url/);
  assert.match(adminScript, /class="record-thumb"/);
});

test("media library supports title input and edit controls", () => {
  assert.match(adminScript, /name="title"/);
  assert.match(adminScript, /data-edit-media/);
  assert.match(adminScript, /data-update-media/);
  assert.match(adminScript, /保存图片/);
});

test("product form exposes a clear main image editor", () => {
  assert.match(adminScript, /class="image-editor"/);
  assert.match(adminScript, /id="productImagePreview"/);
  assert.match(adminScript, /name="productMediaIds"/);
  assert.match(adminScript, /placeholder="200 或 200-700"/);
  assert.doesNotMatch(adminScript, /name="price" type="number"/);
  assert.match(adminScript, /formatAdminPrice/);
  assert.match(adminScript, /updateProductImagePreview/);
  assert.match(adminScript, /data-upload-product-image/);
  assert.match(adminScript, /本地上传并使用/);
  assert.match(adminScript, /accept="image\/\*,video\/\*"/);
  assert.match(adminScript, /multiple="multiple"/);
  assert.match(adminScript, /productImageUpload\.multiple\s*=\s*true/);
  assert.match(adminScript, /mediaPreviewMarkup/);
  assert.match(adminScript, /data-open-media/);
  assert.match(adminScript, /商品主图\/视频/);
});

test("product form keeps multiple uploaded media on one product", () => {
  assert.match(adminScript, /getProductMediaIds/);
  assert.match(adminScript, /setProductMediaIds/);
  assert.match(adminScript, /const productMediaIds = mainImageId/);
  assert.match(adminScript, /productMediaIds,/);
  assert.match(adminScript, /class="product-media-strip"/);
  assert.match(adminScript, /data-preview-product-media/);
  assert.match(adminScript, /openProductMediaLightbox/);
  assert.match(adminStyles, /\.product-media-strip\s*\{[^}]*overflow-x:\s*auto;/s);
  assert.match(adminStyles, /\.media-lightbox\s*\{/);
});

test("product media previews can be dragged to switch the main image", () => {
  assert.match(adminScript, /data-draggable-product-media/);
  assert.match(adminScript, /data-primary-product-drop/);
  assert.match(adminScript, /拖到这里设为主图/);
  assert.match(adminScript, /function reorderProductMedia/);
  assert.match(adminScript, /syncProductMainImageFromMediaIds/);
  assert.match(adminScript, /document\.addEventListener\("dragstart"/);
  assert.match(adminScript, /document\.addEventListener\("drop"/);
  assert.match(adminScript, /setPrimaryProductMedia\(event\.dataTransfer\.getData\("text\/plain"\)\)/);
  assert.match(adminStyles, /\.product-media-preview\s*\{[^}]*cursor:\s*grab;/s);
  assert.match(adminStyles, /\.product-media-primary-drop\s*\{/);
  assert.match(adminStyles, /\.product-media-preview\.dragging\s*\{/);
});

test("product save gives feedback instead of failing silently", () => {
  assert.match(adminScript, /let productImageUploadInProgress = false/);
  assert.match(adminScript, /图片仍在上传，请等待上传完成后再保存商品。/);
  assert.match(adminScript, /submitButton\.textContent = "保存中\.\.\."/);
  assert.match(adminScript, /catch \(error\) \{\s*showError\(error\);/s);
  assert.match(adminScript, /showViewMessage/);
});

test("duplicate product slug errors focus the slug input", () => {
  assert.match(adminScript, /error\.message\.includes\("Slug"\)/);
  assert.match(adminScript, /form\.elements\.slug\.focus\(\)/);
  assert.match(adminScript, /form\.elements\.slug\.select\(\)/);
});

test("product media previews can remove media without showing the media select", () => {
  assert.match(adminScript, /data-remove-product-media/);
  assert.match(adminScript, /function removeProductMedia/);
  assert.match(adminScript, /class="media-select-field"/);
  assert.match(adminStyles, /\.media-select-field\s*\{[^}]*display:\s*none;/s);
  assert.match(adminStyles, /\.media-remove-button\s*\{/);
});

test("product form uses fixed category options", () => {
  assert.match(adminScript, /<select name="category" required>/);
  assert.match(adminScript, /<option value="shoes">SHOES<\/option>/);
  assert.match(adminScript, /<option value="bags">BAGS<\/option>/);
  assert.match(adminScript, /<option value="watches">WATCHES<\/option>/);
  assert.doesNotMatch(adminScript, /<input name="category"/);
});

test("product form uses nav brand categories with custom input", () => {
  assert.match(adminScript, /const brandCategoryOptions/);
  assert.match(adminScript, /Air Jordan/);
  assert.match(adminScript, /Rolex/);
  assert.match(adminScript, /CHANEL/);
  assert.match(adminScript, /<select name="badge" required>/);
  assert.match(adminScript, /data-custom-brand-category/);
  assert.match(adminScript, /name="customBadge"/);
  assert.match(adminScript, /syncBrandCategoryOptions/);
  assert.match(adminScript, /showCustomBrandCategory/);
});

test("admin page cache-busts admin assets after upload control changes", () => {
  const adminHtml = readFileSync(path.join(projectRoot, "public/admin/index.html"), "utf8");
  assert.match(adminHtml, /admin\.js\?v=20260625-brand-logo-admin/);
  assert.match(adminHtml, /admin\.css\?v=20260624-price-range/);
});

test("home module create button opens the editor form", () => {
  assert.match(adminScript, /id="homeModuleForm" class="editor-form" hidden/);
  assert.match(adminScript, /openHomeModuleForm/);
  assert.match(adminScript, /data-new-home-module/);
});
