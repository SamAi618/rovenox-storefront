import { unlink } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { db } from "./db.js";
import { uploadsDir } from "./paths.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename(request, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, extension).replace(/[^\w-]+/g, "-").toLowerCase();
    callback(null, `${Date.now()}-${safeBase || "image"}${extension}`);
  }
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error(`Unsupported image type: ${file.mimetype}`));
      return;
    }
    callback(null, true);
  }
});

function mediaTitle(title, fallback) {
  return typeof title === "string" && title.trim() ? title.trim() : fallback;
}

function uploadedFileData(file) {
  return {
    filename: file.filename,
    url: `/uploads/${file.filename}`,
    mimeType: file.mimetype,
    sizeBytes: file.size
  };
}

async function deleteUploadedFile(asset) {
  if (!asset.url.startsWith("/uploads/")) return;
  await unlink(path.join(uploadsDir, asset.filename)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export function createMediaRecord(file, title = "") {
  const fileData = uploadedFileData(file);
  const url = `/uploads/${file.filename}`;
  const result = db.prepare(`
    INSERT INTO media_assets (filename, original_name, url, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run(fileData.filename, mediaTitle(title, file.originalname), url, fileData.mimeType, fileData.sizeBytes);

  return db.prepare("SELECT * FROM media_assets WHERE id = ?").get(result.lastInsertRowid);
}

export async function updateMediaAsset(id, { title = "", file = null } = {}) {
  const asset = db.prepare("SELECT * FROM media_assets WHERE id = ?").get(id);
  if (!asset) {
    const error = new Error(`Unknown media id: ${id}`);
    error.status = 404;
    throw error;
  }

  const fileData = file ? uploadedFileData(file) : {
    filename: asset.filename,
    url: asset.url,
    mimeType: asset.mime_type,
    sizeBytes: asset.size_bytes
  };
  const nextTitle = mediaTitle(title, asset.original_name);

  db.prepare(`
    UPDATE media_assets
    SET filename = ?, original_name = ?, url = ?, mime_type = ?, size_bytes = ?
    WHERE id = ?
  `).run(fileData.filename, nextTitle, fileData.url, fileData.mimeType, fileData.sizeBytes, id);

  if (file) await deleteUploadedFile(asset);
  return db.prepare("SELECT * FROM media_assets WHERE id = ?").get(id);
}

export function mediaUsageCount(id) {
  const productCount = db.prepare("SELECT COUNT(*) AS count FROM products WHERE main_image_id = ?").get(id).count;
  const moduleCount = db.prepare("SELECT COUNT(*) AS count FROM home_modules WHERE image_id = ?").get(id).count;
  return productCount + moduleCount;
}

export async function deleteMediaAsset(id) {
  const asset = db.prepare("SELECT * FROM media_assets WHERE id = ?").get(id);
  if (!asset) {
    const error = new Error(`Unknown media id: ${id}`);
    error.status = 404;
    throw error;
  }

  const usageCount = mediaUsageCount(id);
  if (usageCount > 0) {
    const error = new Error("Image is currently used by products or homepage modules");
    error.status = 409;
    throw error;
  }

  db.prepare("DELETE FROM media_assets WHERE id = ?").run(id);
  await deleteUploadedFile(asset);
}
