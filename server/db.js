import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { dataDir, databasePath } from "./paths.js";

mkdirSync(dataDir, { recursive: true });

export const db = new Database(databasePath);
db.pragma("foreign_keys = ON");

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      admin_username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS home_modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_type TEXT NOT NULL,
      title TEXT NOT NULL,
      image_id INTEGER,
      link_url TEXT NOT NULL DEFAULT '#related',
      sort_order INTEGER NOT NULL DEFAULT 0,
      visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (image_id) REFERENCES media_assets(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT NOT NULL,
      colors_json TEXT NOT NULL,
      sizes_json TEXT NOT NULL,
      badge TEXT NOT NULL DEFAULT 'Carry',
      tone TEXT NOT NULL DEFAULT 'tone-graphite',
      main_image_id INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_image_id) REFERENCES media_assets(id)
    );

    CREATE TABLE IF NOT EXISTS product_media (
      product_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, media_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (media_id) REFERENCES media_assets(id)
    );
  `);

  db.exec(`
    INSERT OR IGNORE INTO product_media (product_id, media_id, sort_order)
    SELECT id, main_image_id, 0
    FROM products
    WHERE main_image_id IS NOT NULL
  `);
}
