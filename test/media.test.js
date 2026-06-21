import test from "node:test";
import assert from "node:assert/strict";
import { db, initializeDatabase } from "../server/db.js";
import { createMediaRecord, mediaUsageCount, updateMediaAsset } from "../server/media.js";

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

test("createMediaRecord stores custom media title", () => {
  initializeDatabase();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const file = {
    filename: `test-title-${suffix}.webp`,
    originalname: `original-${suffix}.webp`,
    mimetype: "image/webp",
    size: 12
  };
  const media = createMediaRecord(file, "Hero Watch");

  try {
    assert.equal(media.original_name, "Hero Watch");
    assert.equal(media.url, `/uploads/${file.filename}`);
  } finally {
    db.prepare("DELETE FROM media_assets WHERE id = ?").run(media.id);
  }
});

test("updateMediaAsset updates title and optional replacement file", async () => {
  initializeDatabase();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const mediaId = db.prepare(`
    INSERT INTO media_assets (filename, original_name, url, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run(`test-update-${suffix}.webp`, "Old Title", `/uploads/test-update-${suffix}.webp`, "image/webp", 10).lastInsertRowid;

  try {
    const titleOnly = await updateMediaAsset(mediaId, { title: "New Title" });
    assert.equal(titleOnly.original_name, "New Title");
    assert.equal(titleOnly.filename, `test-update-${suffix}.webp`);

    const replacement = await updateMediaAsset(mediaId, {
      title: "Replacement Title",
      file: {
        filename: `test-replacement-${suffix}.png`,
        originalname: `replacement-${suffix}.png`,
        mimetype: "image/png",
        size: 22
      }
    });

    assert.equal(replacement.original_name, "Replacement Title");
    assert.equal(replacement.filename, `test-replacement-${suffix}.png`);
    assert.equal(replacement.url, `/uploads/test-replacement-${suffix}.png`);
    assert.equal(replacement.mime_type, "image/png");
    assert.equal(replacement.size_bytes, 22);
  } finally {
    db.prepare("DELETE FROM media_assets WHERE id = ?").run(mediaId);
  }
});
