import test from "node:test";
import assert from "node:assert/strict";
import { db, initializeDatabase } from "../server/db.js";
import { mediaUsageCount } from "../server/media.js";

test("mediaUsageCount counts product and home module references", () => {
  initializeDatabase();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const mediaId = db.prepare(`
    INSERT INTO media_assets (filename, original_name, url, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run(`test-${suffix}.webp`, `test-${suffix}.webp`, `/uploads/test-${suffix}.webp`, "image/webp", 10).lastInsertRowid;

  try {
    assert.equal(mediaUsageCount(mediaId), 0);

    db.prepare(`
      INSERT INTO products (slug, name, category, price, description, colors_json, sizes_json, main_image_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`test-product-${suffix}`, "Test Product", "watches", 1, "Test", "[]", "[]", mediaId);

    db.prepare(`
      INSERT INTO home_modules (module_type, title, image_id)
      VALUES (?, ?, ?)
    `).run("brand_logo", "Test Module", mediaId);

    assert.equal(mediaUsageCount(mediaId), 2);
  } finally {
    db.prepare("DELETE FROM products WHERE slug = ?").run(`test-product-${suffix}`);
    db.prepare("DELETE FROM home_modules WHERE title = ? AND image_id = ?").run("Test Module", mediaId);
    db.prepare("DELETE FROM media_assets WHERE id = ?").run(mediaId);
  }
});
