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
  assert.match(adminStyles, /\.media-card img\s*\{[^}]*object-fit:\s*contain;/s);
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
  assert.match(adminScript, /updateProductImagePreview/);
  assert.match(adminScript, /data-open-media/);
  assert.match(adminScript, /更换商品图片/);
});
