import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { projectRoot } from "../server/paths.js";

const appScript = readFileSync(path.join(projectRoot, "public/app.js"), "utf8");
const styles = readFileSync(path.join(projectRoot, "public/styles.css"), "utf8");

test("product detail modal uses WhatsApp ordering layout", () => {
  assert.match(appScript, /class="detail-stock"/);
  assert.match(appScript, />Quantity</);
  assert.match(appScript, />In Stock</);
  assert.match(appScript, /Contact whatsapp to order/);
  assert.match(appScript, /class="detail-whatsapp"/);
  assert.match(appScript, /whatsappProductUrl/);
});

test("product detail WhatsApp area follows reference spacing and button style", () => {
  assert.match(styles, /\.detail-stock\s*\{[^}]*margin:\s*32px 0 0;/s);
  assert.match(styles, /\.detail-order-copy\s*\{[^}]*margin:\s*96px 0 48px;/s);
  assert.match(styles, /\.detail-whatsapp\s*\{[^}]*background:\s*#25d366;/s);
  assert.match(styles, /\.detail-whatsapp\s*\{[^}]*width:\s*100%;/s);
});

test("desktop nav dropdowns are click controlled and filter products", () => {
  const indexHtml = readFileSync(path.join(projectRoot, "public/index.html"), "utf8");
  assert.match(indexHtml, /button class="nav-trigger"[^>]*data-nav-menu="shoes"/);
  assert.match(indexHtml, /href="#related" data-filter="shoes" data-brand-filter="Nike">Nike/);
  assert.match(indexHtml, /button class="nav-trigger"[^>]*data-nav-menu="watches"/);
  assert.match(indexHtml, /href="#related" data-filter="watches" data-brand-filter="Rolex">Rolex/);
  assert.match(indexHtml, /button class="nav-trigger"[^>]*data-nav-menu="bags"/);
  assert.match(indexHtml, /href="#related" data-filter="bags" data-brand-filter="CHANEL">CHANEL/);
  assert.match(appScript, /function toggleNavMenu/);
  assert.match(appScript, /closeNavMenus/);
  assert.match(styles, /\.nav-item\.open \.nav-menu\s*\{/);
  assert.doesNotMatch(styles, /\.nav-item:hover \.nav-menu/);
});

test("brand nav links filter to the selected product badge only", () => {
  assert.match(appScript, /let activeBrandFilter = ""/);
  assert.match(appScript, /product\.badge\.toLowerCase\(\) === activeBrandFilter/);
  assert.match(appScript, /target\.dataset\.brandFilter/);
  assert.match(appScript, /button\.dataset\.brandFilter/);
});

test("storefront can display custom product brand categories", () => {
  assert.match(appScript, /translatedBadge\.startsWith\("badge\."\)/);
  assert.match(appScript, /return translatedBadge\.startsWith\("badge\."\) \? product\.badge : translatedBadge;/);
});

test("product detail modal renders a thumbnail gallery from product media", () => {
  assert.match(appScript, /function productDetailGallery/);
  assert.match(appScript, /function productGalleryMedia/);
  assert.match(appScript, /data-detail-media-index/);
  assert.match(appScript, /data-detail-main-media/);
  assert.match(appScript, /product\.media/);
  assert.match(styles, /\.detail-gallery\s*\{/);
  assert.match(styles, /\.detail-thumbs\s*\{/);
  assert.match(styles, /\.detail-main-media\s*\{/);
});

test("storefront can display product price ranges", () => {
  assert.match(appScript, /function priceBounds/);
  assert.match(appScript, /range\.min\.toLocaleString\("en-US"\)/);
  assert.match(appScript, /range\.max\.toLocaleString\("en-US"\)/);
  assert.match(appScript, /summary\.totalMin/);
  assert.match(appScript, /summary\.totalMax/);
});
