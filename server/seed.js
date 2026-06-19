import bcrypt from "bcryptjs";
import { db, initializeDatabase } from "./db.js";
import { loadCurrentStorefrontData, slugify } from "./extract-current-data.js";

initializeDatabase();

function imageMimeType(imagePath) {
  if (imagePath.endsWith(".png")) return "image/png";
  if (imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg")) return "image/jpeg";
  if (imagePath.endsWith(".gif")) return "image/gif";
  return "image/webp";
}

function ensureMediaAsset(imagePath, originalName = imagePath) {
  if (!imagePath) return null;

  const url = `/${imagePath}`;
  const existing = db.prepare("SELECT id FROM media_assets WHERE url = ?").get(url);
  if (existing) return existing.id;

  const result = db.prepare(`
    INSERT INTO media_assets (filename, original_name, url, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run(imagePath.split("/").pop(), originalName, url, imageMimeType(imagePath), 0);

  return result.lastInsertRowid;
}

function seedAdmin() {
  const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123456", 10);
  db.prepare(`
    INSERT INTO admin_settings (id, admin_username, password_hash)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      admin_username = excluded.admin_username,
      password_hash = excluded.password_hash,
      updated_at = CURRENT_TIMESTAMP
  `).run(process.env.ADMIN_USERNAME || "admin", passwordHash);
}

function seedHomeModules(homeModules) {
  const current = db.prepare("SELECT COUNT(*) AS count FROM home_modules").get();
  if (current.count > 0) return 0;

  for (const module of homeModules) {
    const imageId = ensureMediaAsset(module.imagePath, module.alt);
    db.prepare(`
      INSERT INTO home_modules (module_type, title, image_id, link_url, sort_order, visible)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(module.moduleType, module.title, imageId, module.linkUrl, module.sortOrder);
  }

  return homeModules.length;
}

function seedProducts(products) {
  for (const [index, product] of products.entries()) {
    const imageId = ensureMediaAsset(product.image, product.name);
    db.prepare(`
      INSERT INTO products (
        slug, name, category, price, description, colors_json, sizes_json,
        badge, tone, main_image_id, sort_order, visible
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        price = excluded.price,
        description = excluded.description,
        colors_json = excluded.colors_json,
        sizes_json = excluded.sizes_json,
        badge = excluded.badge,
        tone = excluded.tone,
        main_image_id = excluded.main_image_id,
        sort_order = excluded.sort_order,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      product.id || slugify(product.name),
      product.name,
      product.category,
      product.price,
      product.description,
      JSON.stringify(product.colors || []),
      JSON.stringify(product.sizes || []),
      product.badge || "Carry",
      product.tone || "tone-graphite",
      imageId,
      index
    );
  }

  return products.length;
}

const data = await loadCurrentStorefrontData();
const result = db.transaction(() => {
  seedAdmin();
  return {
    products: seedProducts(data.products),
    homeModules: seedHomeModules(data.homeModules)
  };
})();

console.log(JSON.stringify(result, null, 2));
