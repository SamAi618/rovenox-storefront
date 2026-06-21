import { Router } from "express";
import { requireAdmin, verifyAdminLogin } from "./auth.js";
import { db } from "./db.js";
import { createMediaRecord, deleteMediaAsset, updateMediaAsset, uploadImage } from "./media.js";
import { normalizeStringList, requireInteger, requireString } from "./validators.js";

export const adminApi = Router();

adminApi.post("/login", (request, response) => {
  const { username, password } = request.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    response.status(400).json({ error: "Username and password are required" });
    return;
  }
  if (!verifyAdminLogin(username, password)) {
    response.status(401).json({ error: "Invalid username or password" });
    return;
  }
  request.session.admin = { username };
  response.json({ ok: true, username });
});

adminApi.post("/logout", requireAdmin, (request, response) => {
  request.session.destroy(() => {
    response.json({ ok: true });
  });
});

adminApi.get("/session", (request, response) => {
  response.json({
    authenticated: Boolean(request.session?.admin),
    username: request.session?.admin?.username || null
  });
});

adminApi.get("/media", requireAdmin, (request, response) => {
  const media = db.prepare("SELECT * FROM media_assets ORDER BY created_at DESC, id DESC").all();
  response.json({ media });
});

adminApi.post("/media", requireAdmin, uploadImage.single("image"), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: "Image file is required" });
    return;
  }
  response.status(201).json({ media: createMediaRecord(request.file, request.body?.title) });
});

adminApi.put("/media/:id", requireAdmin, uploadImage.single("image"), async (request, response, next) => {
  try {
    const media = await updateMediaAsset(Number(request.params.id), {
      title: request.body?.title,
      file: request.file || null
    });
    response.json({ media });
  } catch (error) {
    next(error);
  }
});

adminApi.delete("/media/:id", requireAdmin, async (request, response, next) => {
  try {
    await deleteMediaAsset(Number(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

function readProductPayload(body) {
  return {
    slug: requireString(body.slug, "slug"),
    name: requireString(body.name, "name"),
    category: requireString(body.category, "category"),
    price: requireInteger(body.price, "price"),
    description: requireString(body.description, "description"),
    colorsJson: JSON.stringify(normalizeStringList(body.colors, "colors")),
    sizesJson: JSON.stringify(normalizeStringList(body.sizes, "sizes")),
    badge: requireString(body.badge || "Carry", "badge"),
    tone: requireString(body.tone || "tone-graphite", "tone"),
    mainImageId: body.mainImageId ? requireInteger(body.mainImageId, "mainImageId") : null,
    sortOrder: requireInteger(body.sortOrder || 0, "sortOrder"),
    visible: body.visible === false ? 0 : 1
  };
}

adminApi.get("/products", requireAdmin, (request, response) => {
  const products = db.prepare(`
    SELECT products.*, media_assets.url AS image_url
    FROM products
    LEFT JOIN media_assets ON media_assets.id = products.main_image_id
    ORDER BY products.sort_order ASC, products.id ASC
  `).all();
  response.json({ products });
});

adminApi.post("/products", requireAdmin, (request, response) => {
  const product = readProductPayload(request.body || {});
  const result = db.prepare(`
    INSERT INTO products (
      slug, name, category, price, description, colors_json, sizes_json,
      badge, tone, main_image_id, sort_order, visible
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    product.slug,
    product.name,
    product.category,
    product.price,
    product.description,
    product.colorsJson,
    product.sizesJson,
    product.badge,
    product.tone,
    product.mainImageId,
    product.sortOrder,
    product.visible
  );
  response.status(201).json({ id: result.lastInsertRowid });
});

adminApi.put("/products/:id", requireAdmin, (request, response) => {
  const product = readProductPayload(request.body || {});
  const result = db.prepare(`
    UPDATE products
    SET slug = ?, name = ?, category = ?, price = ?, description = ?,
      colors_json = ?, sizes_json = ?, badge = ?, tone = ?, main_image_id = ?,
      sort_order = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    product.slug,
    product.name,
    product.category,
    product.price,
    product.description,
    product.colorsJson,
    product.sizesJson,
    product.badge,
    product.tone,
    product.mainImageId,
    product.sortOrder,
    product.visible,
    Number(request.params.id)
  );
  if (result.changes === 0) response.status(404).json({ error: "Product not found" });
  else response.json({ ok: true });
});

adminApi.delete("/products/:id", requireAdmin, (request, response) => {
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(Number(request.params.id));
  if (result.changes === 0) response.status(404).json({ error: "Product not found" });
  else response.json({ ok: true });
});

function readHomeModulePayload(body) {
  return {
    moduleType: requireString(body.moduleType, "moduleType"),
    title: requireString(body.title, "title"),
    imageId: body.imageId ? requireInteger(body.imageId, "imageId") : null,
    linkUrl: requireString(body.linkUrl || "#related", "linkUrl"),
    sortOrder: requireInteger(body.sortOrder || 0, "sortOrder"),
    visible: body.visible === false ? 0 : 1
  };
}

adminApi.get("/home-modules", requireAdmin, (request, response) => {
  const modules = db.prepare(`
    SELECT home_modules.*, media_assets.url AS image_url
    FROM home_modules
    LEFT JOIN media_assets ON media_assets.id = home_modules.image_id
    ORDER BY home_modules.module_type ASC, home_modules.sort_order ASC, home_modules.id ASC
  `).all();
  response.json({ modules });
});

adminApi.post("/home-modules", requireAdmin, (request, response) => {
  const module = readHomeModulePayload(request.body || {});
  const result = db.prepare(`
    INSERT INTO home_modules (module_type, title, image_id, link_url, sort_order, visible)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(module.moduleType, module.title, module.imageId, module.linkUrl, module.sortOrder, module.visible);
  response.status(201).json({ id: result.lastInsertRowid });
});

adminApi.put("/home-modules/:id", requireAdmin, (request, response) => {
  const module = readHomeModulePayload(request.body || {});
  const result = db.prepare(`
    UPDATE home_modules
    SET module_type = ?, title = ?, image_id = ?, link_url = ?, sort_order = ?,
      visible = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    module.moduleType,
    module.title,
    module.imageId,
    module.linkUrl,
    module.sortOrder,
    module.visible,
    Number(request.params.id)
  );
  if (result.changes === 0) response.status(404).json({ error: "Home module not found" });
  else response.json({ ok: true });
});

adminApi.delete("/home-modules/:id", requireAdmin, (request, response) => {
  const result = db.prepare("DELETE FROM home_modules WHERE id = ?").run(Number(request.params.id));
  if (result.changes === 0) response.status(404).json({ error: "Home module not found" });
  else response.json({ ok: true });
});
