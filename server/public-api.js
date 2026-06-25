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
  const media = row.media_json ? parseJsonArray(row.media_json) : [];
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
    image: row.image_url ? row.image_url.replace(/^\//, "") : null,
    mediaType: row.media_mime_type || null,
    media: media.map((item) => ({
      url: item.url.replace(/^\//, ""),
      mediaType: item.mime_type,
      title: item.original_name
    }))
  };
}

export function homeModuleRowToJson(row) {
  return {
    id: row.id,
    moduleType: row.module_type,
    title: row.title,
    image: row.image_url ? row.image_url.replace(/^\//, "") : null,
    linkUrl: row.link_url,
    sortOrder: row.sort_order
  };
}

publicApi.get("/products", (request, response) => {
  const rows = db.prepare(`
    SELECT products.*, media_assets.url AS image_url, media_assets.mime_type AS media_mime_type,
      COALESCE((
        SELECT json_group_array(json_object(
          'url', media_assets_for_product.url,
          'mime_type', media_assets_for_product.mime_type,
          'original_name', media_assets_for_product.original_name
        ))
        FROM product_media
        JOIN media_assets AS media_assets_for_product ON media_assets_for_product.id = product_media.media_id
        WHERE product_media.product_id = products.id
        ORDER BY product_media.sort_order ASC, product_media.media_id ASC
      ), '[]') AS media_json
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
    modules: rows.map(homeModuleRowToJson)
  });
});
