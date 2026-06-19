import test from "node:test";
import assert from "node:assert/strict";
import { extractImageModules, extractProducts, slugify } from "../server/extract-current-data.js";

test("slugify creates stable URL-safe slugs", () => {
  assert.equal(slugify("Aster Field Chrono Watch"), "aster-field-chrono-watch");
});

test("extractProducts reads the current app.js products literal", () => {
  const products = extractProducts('const products = [{ id: "rn-watch-01", name: "Watch" }]; const cart = new Map();');
  assert.equal(products.length, 1);
  assert.equal(products[0].id, "rn-watch-01");
});

test("extractProducts also supports migrated let declaration", () => {
  const products = extractProducts('let products = [{ id: "rn-shoe-01", name: "Shoe" }]; const cart = new Map();');
  assert.equal(products.length, 1);
  assert.equal(products[0].id, "rn-shoe-01");
});

test("extractImageModules reads brand and category image anchors", () => {
  const html = `
    <section class="brand-logo-section"><a href="#related"><img src="images/logo.png" alt="Logo"></a></section>
    <section class="image-category-section"><a href="#related"><img src="images/watch.webp" alt="Watch"><span>ROLEX</span></a></section>
  `;
  const modules = extractImageModules(html);
  assert.equal(modules.length, 2);
  assert.equal(modules[0].moduleType, "brand_logo");
  assert.equal(modules[1].title, "ROLEX");
});
