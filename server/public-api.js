import { Router } from "express";
import { db } from "./db.js";

export const publicApi = Router();

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function productRowToJson(row) {
  return {
    id: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    description: row.description,
    colors: parseJsonArray(row.colors_json),
    sizes: parseJsonArray(row.sizes_json),
    badge: row.badge,
    tone: row.tone,
    image: row.image_url ? row.image_url.replace(/^\//, "") : null
  };
}

publicApi.get("/products", (request, response) => {
  const rows = db.prepare(`
    SELECT products.*, media_assets.url AS image_url
    FROM products
    LEFT JOIN media_assets ON media_assets.id = products.main_image_id
    WHERE products.visible = 1
    ORDER BY products.sort_order ASC, products.id ASC
  `).all();
  response.json({ products: rows.map(productRowToJson) });
});

publicApi.get("/home", (request, response) => {
  const rows = db.prepare(`
    SELECT home_modules.*, media_assets.url AS image_url
    FROM home_modules
    LEFT JOIN media_assets ON media_assets.id = home_modules.image_id
    WHERE home_modules.visible = 1
    ORDER BY home_modules.module_type ASC, home_modules.sort_order ASC, home_modules.id ASC
  `).all();
  response.json({
    modules: rows.map((row) => ({
      id: row.id,
      moduleType: row.module_type,
      title: row.title,
      image: row.image_url ? row.image_url.replace(/^\//, "") : null,
      linkUrl: row.link_url,
      sortOrder: row.sort_order
    }))
  });
});
