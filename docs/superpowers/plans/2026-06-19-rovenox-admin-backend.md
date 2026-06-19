# RoveNox 轻量后台服务 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前 RoveNox 纯静态站升级成 Node.js + SQLite 轻量服务，并提供可登录的 `/admin` 后台管理首页图片、商品图片和商品信息。

**Architecture:** 保留现有前台视觉和交互，把静态文件迁移到 `public/`，由 Node 服务托管。后端提供公开 API 给前台读取商品和首页模块，提供受 session 保护的后台 API 给管理页上传图片、编辑商品和首页模块。

**Tech Stack:** Node.js ESM、Express、SQLite、Multer、bcryptjs、express-session、原生 HTML/CSS/JS、node:test。

---

## Scope Check

这份计划覆盖一个连续功能：把 RoveNox 从静态站升级成轻量服务后台。它包含服务骨架、数据库、公开 API、后台登录、媒体库、商品管理、首页模块和前台迁移。这些部分彼此依赖，不需要拆成多个独立规格。

## Target File Structure

- Create: `package.json` - 项目脚本和运行依赖。
- Create: `server.js` - Node 服务入口，注册静态目录、uploads、API 和 SPA/admin 路由。
- Create: `server/db.js` - SQLite 连接、schema 初始化、通用查询方法。
- Create: `server/paths.js` - 项目路径常量，避免路径散落各处。
- Create: `server/validators.js` - 商品、首页模块、媒体输入校验。
- Create: `server/auth.js` - session 登录保护、密码 hash 校验。
- Create: `server/media.js` - 上传文件、图片元数据、引用检查和删除逻辑。
- Create: `server/public-api.js` - `/api/public/*` 公开接口。
- Create: `server/admin-api.js` - `/api/admin/*` 后台接口。
- Create: `server/seed.js` - 从现有静态数据导入 SQLite。
- Create: `server/extract-current-data.js` - 从当前 `app.js` 和 `index.html` 提取产品和首页图片模块。
- Create: `test/*.test.js` - 后端关键行为测试。
- Move: `index.html`, `styles.css`, `app.js`, `translations.js`, `images/` -> `public/`。
- Create: `public/admin/index.html` - 后台单页应用。
- Create: `public/admin/admin.css` - 后台样式。
- Create: `public/admin/admin.js` - 后台交互、API 调用、表单提交。
- Modify: `.gitignore` - 已包含 `node_modules/`, `data/`, `uploads/`, `.env`。

## Implementation Tasks

### Task 1: Project Runtime Setup

**Files:**
- Create: `package.json`
- Create: `server/paths.js`
- Create: `server/db.js`
- Create: `server.js`
- Test: `test/health.test.js`

- [ ] **Step 1: Create `package.json`**

Create a Node ESM project using `pnpm`. Do not pin versions manually; let `pnpm add` resolve current stable versions during execution.

```json
{
  "name": "rovenox-storefront",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js",
    "seed": "node server/seed.js",
    "test": "node --test"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- [ ] **Step 2: Install runtime dependencies**

Run:

```bash
pnpm add express better-sqlite3 multer bcryptjs express-session
```

Expected: `package.json`, `pnpm-lock.yaml`, and `node_modules/` are created or updated.

- [ ] **Step 3: Create `server/paths.js`**

```js
import path from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const publicDir = path.join(projectRoot, "public");
export const uploadsDir = path.join(projectRoot, "uploads");
export const dataDir = path.join(projectRoot, "data");
export const databasePath = path.join(dataDir, "rovenox.db");
```

- [ ] **Step 4: Create `server/db.js` with schema initialization**

```js
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
  `);
}
```

- [ ] **Step 5: Create `server.js` health endpoint and static hosting shell**

```js
import express from "express";
import session from "express-session";
import { mkdirSync } from "node:fs";
import { initializeDatabase } from "./server/db.js";
import { publicDir, uploadsDir } from "./server/paths.js";

initializeDatabase();
mkdirSync(uploadsDir, { recursive: true });

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "rovenox.sid",
  secret: process.env.SESSION_SECRET || "rovenox-local-dev-secret-change-before-deploy",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false
  }
}));

app.get("/api/health", (request, response) => {
  response.json({ ok: true });
});

app.use("/uploads", express.static(uploadsDir, { fallthrough: false }));
app.use(express.static(publicDir));

app.listen(port, "127.0.0.1", () => {
  console.log(`RoveNox running at http://127.0.0.1:${port}`);
});
```

- [ ] **Step 6: Create `test/health.test.js`**

Use `node:test` for pure unit coverage first. Full HTTP route testing can be added after APIs are modularized.

```js
import test from "node:test";
import assert from "node:assert/strict";
import { databasePath, publicDir, uploadsDir } from "../server/paths.js";

test("project paths point to expected runtime locations", () => {
  assert.match(databasePath, /data\/rovenox\.db$/);
  assert.match(publicDir, /public$/);
  assert.match(uploadsDir, /uploads$/);
});
```

- [ ] **Step 7: Run tests**

Run:

```bash
pnpm test
```

Expected: `test/health.test.js` passes.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-lock.yaml server.js server test
git commit -m "feat: add Node service skeleton"
```

### Task 2: Move Static Storefront Under `public/`

**Files:**
- Move: `index.html` -> `public/index.html`
- Move: `styles.css` -> `public/styles.css`
- Move: `app.js` -> `public/app.js`
- Move: `translations.js` -> `public/translations.js`
- Move: `images/` -> `public/images/`
- Modify: `scripts/export-product-details.mjs`

- [ ] **Step 1: Move current storefront files with git**

Run:

```bash
mkdir -p public
git mv index.html styles.css app.js translations.js public/
git mv images public/images
```

Expected: `public/index.html`, `public/app.js`, `public/styles.css`, `public/translations.js`, and `public/images/` exist.

- [ ] **Step 2: Update `scripts/export-product-details.mjs` paths**

Change path reads from project root to `public/`:

```js
const publicRoot = path.join(projectRoot, "public");
```

Use `publicRoot` for `app.js` and image manifests:

```js
const appSource = await readFile(path.join(publicRoot, "app.js"), "utf8");

const manifestPaths = [
  path.join(publicRoot, "images", "annekali", "watches-manifest.json"),
  path.join(publicRoot, "images", "annekali", "products-manifest.json")
];
```

In `copyImage`, resolve current static image paths against `publicRoot`:

```js
const sourcePath = path.join(publicRoot, sourceRelativePath);
```

- [ ] **Step 3: Run static service**

Run:

```bash
pnpm dev
```

Expected: console prints `RoveNox running at http://127.0.0.1:3000`.

- [ ] **Step 4: Verify storefront opens**

Run:

```bash
/usr/bin/curl -I http://127.0.0.1:3000
```

Expected: `HTTP/1.1 200 OK` or `HTTP/1.0 200 OK`.

- [ ] **Step 5: Commit**

```bash
git add public scripts server.js
git commit -m "chore: serve storefront from public directory"
```

### Task 3: Extract and Seed Current Storefront Data

**Files:**
- Create: `server/extract-current-data.js`
- Create: `server/seed.js`
- Test: `test/extract-current-data.test.js`

- [ ] **Step 1: Create `server/extract-current-data.js`**

```js
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { publicDir } from "./paths.js";

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90) || "item";
}

export function extractProducts(appSource) {
  const marker = "const products = ";
  const start = appSource.indexOf(marker);
  if (start === -1) throw new Error("Cannot find products array in app.js");

  const arrayStart = appSource.indexOf("[", start + marker.length);
  if (arrayStart === -1) throw new Error("Cannot find products array start in app.js");

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = arrayStart; index < appSource.length; index += 1) {
    const char = appSource[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) inString = false;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) {
      return vm.runInNewContext(appSource.slice(arrayStart, index + 1));
    }
  }

  throw new Error("Cannot find products array end in app.js");
}

export function extractImageModules(indexSource) {
  const modules = [];
  const brandSection = indexSource.match(/<section class="brand-logo-section"[\s\S]*?<\/section>/);
  const categorySection = indexSource.match(/<section class="image-category-section"[\s\S]*?<\/section>/);

  for (const [moduleType, section] of [
    ["brand_logo", brandSection?.[0] || ""],
    ["image_category", categorySection?.[0] || ""]
  ]) {
    const pattern = /<a[^>]*href="([^"]*)"[^>]*>\s*<img src="([^"]*)" alt="([^"]*)"[^>]*>\s*(?:<span>([^<]*)<\/span>)?/g;
    let match;
    let sortOrder = 0;
    while ((match = pattern.exec(section)) !== null) {
      modules.push({
        moduleType,
        linkUrl: match[1],
        imagePath: match[2],
        title: match[4] || match[3],
        alt: match[3],
        sortOrder
      });
      sortOrder += 1;
    }
  }

  return modules;
}

export async function loadCurrentStorefrontData() {
  const appSource = await readFile(path.join(publicDir, "app.js"), "utf8");
  const indexSource = await readFile(path.join(publicDir, "index.html"), "utf8");
  return {
    products: extractProducts(appSource),
    homeModules: extractImageModules(indexSource)
  };
}
```

- [ ] **Step 2: Create `test/extract-current-data.test.js`**

```js
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
```

- [ ] **Step 3: Create `server/seed.js`**

```js
import bcrypt from "bcryptjs";
import { db, initializeDatabase } from "./db.js";
import { loadCurrentStorefrontData, slugify } from "./extract-current-data.js";

initializeDatabase();

function ensureMediaAsset(imagePath, originalName = imagePath) {
  if (!imagePath) return null;
  const existing = db.prepare("SELECT id FROM media_assets WHERE url = ?").get(`/${imagePath}`);
  if (existing) return existing.id;

  const result = db.prepare(`
    INSERT INTO media_assets (filename, original_name, url, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run(imagePath.split("/").pop(), originalName, `/${imagePath}`, imagePath.endsWith(".png") ? "image/png" : "image/webp", 0);

  return result.lastInsertRowid;
}

const seed = db.transaction((data) => {
  const passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123456", 10);

  db.prepare(`
    INSERT INTO admin_settings (id, admin_username, password_hash)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET admin_username = excluded.admin_username
  `).run(process.env.ADMIN_USERNAME || "admin", passwordHash);

  for (const module of data.homeModules) {
    const imageId = ensureMediaAsset(module.imagePath, module.alt);
    db.prepare(`
      INSERT INTO home_modules (module_type, title, image_id, link_url, sort_order, visible)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(module.moduleType, module.title, imageId, module.linkUrl, module.sortOrder);
  }

  for (const [index, product] of data.products.entries()) {
    const imageId = ensureMediaAsset(product.image, product.name);
    db.prepare(`
      INSERT INTO products (slug, name, category, price, description, colors_json, sizes_json, badge, tone, main_image_id, sort_order, visible)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
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
});

const data = await loadCurrentStorefrontData();
seed(data);
console.log(JSON.stringify({
  products: data.products.length,
  homeModules: data.homeModules.length
}, null, 2));
```

- [ ] **Step 4: Run extraction tests**

Run:

```bash
pnpm test
```

Expected: extraction tests pass.

- [ ] **Step 5: Run seed**

Run:

```bash
pnpm seed
```

Expected: prints product and home module counts. `data/rovenox.db` exists but remains ignored by git.

- [ ] **Step 6: Commit**

```bash
git add server test
git commit -m "feat: seed storefront data into SQLite"
```

### Task 4: Public API and Product Loading

**Files:**
- Create: `server/public-api.js`
- Modify: `server.js`
- Modify: `public/app.js`
- Test: `test/public-api.test.js`

- [ ] **Step 1: Create `server/public-api.js`**

```js
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

function productRowToJson(row) {
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
```

- [ ] **Step 2: Register public API in `server.js`**

Add:

```js
import { publicApi } from "./server/public-api.js";
```

Before static hosting:

```js
app.use("/api/public", publicApi);
```

- [ ] **Step 3: Modify `public/app.js` product declaration**

Change `const products = [` to:

```js
let products = [
```

Add this function before `setLanguage(activeLanguage);`:

```js
async function loadProducts() {
  const response = await fetch("/api/public/products");
  if (!response.ok) throw new Error(`Cannot load products: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.products)) throw new Error("Invalid products response");
  products = data.products;
}
```

Replace the final initialization:

```js
setLanguage(activeLanguage);
window.requestAnimationFrame(() => document.body.classList.add("is-ready"));
```

with:

```js
loadProducts()
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    setLanguage(activeLanguage);
    window.requestAnimationFrame(() => document.body.classList.add("is-ready"));
  });
```

- [ ] **Step 4: Verify public products API**

Run:

```bash
pnpm seed
pnpm dev
/usr/bin/curl http://127.0.0.1:3000/api/public/products
```

Expected: JSON with a `products` array.

- [ ] **Step 5: Commit**

```bash
git add server public/app.js
git commit -m "feat: load storefront products from API"
```

### Task 5: Admin Authentication

**Files:**
- Create: `server/auth.js`
- Create: `server/admin-api.js`
- Modify: `server.js`
- Create: `public/admin/index.html`
- Create: `public/admin/admin.css`
- Create: `public/admin/admin.js`

- [ ] **Step 1: Create `server/auth.js`**

```js
import bcrypt from "bcryptjs";
import { db } from "./db.js";

export function requireAdmin(request, response, next) {
  if (!request.session?.admin) {
    response.status(401).json({ error: "Admin login required" });
    return;
  }
  next();
}

export function verifyAdminLogin(username, password) {
  const settings = db.prepare("SELECT admin_username, password_hash FROM admin_settings WHERE id = 1").get();
  if (!settings) return false;
  if (username !== settings.admin_username) return false;
  return bcrypt.compareSync(password, settings.password_hash);
}
```

- [ ] **Step 2: Create base `server/admin-api.js`**

```js
import { Router } from "express";
import { requireAdmin, verifyAdminLogin } from "./auth.js";

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
```

- [ ] **Step 3: Register admin API and admin route in `server.js`**

Add:

```js
import path from "node:path";
import { adminApi } from "./server/admin-api.js";
```

Before static hosting:

```js
app.use("/api/admin", adminApi);
app.get("/admin", (request, response) => {
  response.sendFile(path.join(publicDir, "admin", "index.html"));
});
```

- [ ] **Step 4: Create `public/admin/index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoveNox Admin</title>
    <link rel="stylesheet" href="/admin/admin.css">
  </head>
  <body>
    <main class="admin-shell">
      <section class="login-panel" id="loginPanel">
        <h1>RoveNox 后台</h1>
        <form id="loginForm">
          <label>账号<input name="username" autocomplete="username" required></label>
          <label>密码<input name="password" type="password" autocomplete="current-password" required></label>
          <button type="submit">登录</button>
        </form>
        <p class="message" id="loginMessage"></p>
      </section>
      <section class="dashboard" id="dashboard" hidden>
        <aside class="sidebar">
          <strong>RoveNox Admin</strong>
          <button data-view="media">媒体库</button>
          <button data-view="home">首页模块</button>
          <button data-view="products">商品管理</button>
          <button id="logoutButton">退出</button>
        </aside>
        <section class="workspace">
          <header><h2 id="viewTitle">概览</h2></header>
          <div id="viewBody"></div>
        </section>
      </section>
    </main>
    <script src="/admin/admin.js" defer></script>
  </body>
</html>
```

- [ ] **Step 5: Create minimal `public/admin/admin.css`**

```css
body {
  margin: 0;
  font-family: Arial, "PingFang SC", sans-serif;
  background: #f5f5f2;
  color: #20201d;
}

.admin-shell {
  min-height: 100vh;
}

.login-panel {
  width: min(380px, calc(100% - 32px));
  margin: 12vh auto;
  padding: 24px;
  background: #fff;
  border: 1px solid #deded8;
}

label {
  display: grid;
  gap: 6px;
  margin: 12px 0;
}

input,
button,
textarea,
select {
  font: inherit;
}

input,
textarea,
select {
  padding: 10px;
  border: 1px solid #c9c9c1;
}

button {
  padding: 10px 14px;
  border: 1px solid #20201d;
  background: #20201d;
  color: #fff;
  cursor: pointer;
}

.dashboard {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.sidebar {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 20px;
  background: #20201d;
  color: #fff;
}

.workspace {
  padding: 24px;
}

.message {
  color: #7c3aed;
}
```

- [ ] **Step 6: Create minimal `public/admin/admin.js`**

```js
const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const viewTitle = document.querySelector("#viewTitle");
const viewBody = document.querySelector("#viewBody");

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  viewTitle.textContent = "概览";
  viewBody.innerHTML = "<p>请选择左侧功能。</p>";
}

async function checkSession() {
  const session = await api("/api/admin/session");
  if (session.authenticated) showDashboard();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password")
      })
    });
    showDashboard();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

logoutButton.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  location.reload();
});

checkSession().catch(() => {});
```

- [ ] **Step 7: Verify login**

Run:

```bash
pnpm seed
pnpm dev
```

Open `http://127.0.0.1:3000/admin`. Login with `admin` / `admin123456`.

Expected: dashboard appears.

- [ ] **Step 8: Commit**

```bash
git add server public/admin server.js
git commit -m "feat: add admin login shell"
```

### Task 6: Media Library API

**Files:**
- Create: `server/media.js`
- Modify: `server/admin-api.js`
- Modify: `public/admin/admin.js`
- Modify: `public/admin/admin.css`

- [ ] **Step 1: Create `server/media.js`**

```js
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

export function createMediaRecord(file) {
  const url = `/uploads/${file.filename}`;
  const result = db.prepare(`
    INSERT INTO media_assets (filename, original_name, url, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run(file.filename, file.originalname, url, file.mimetype, file.size);
  return db.prepare("SELECT * FROM media_assets WHERE id = ?").get(result.lastInsertRowid);
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
  await unlink(path.join(uploadsDir, asset.filename)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}
```

- [ ] **Step 2: Add media routes to `server/admin-api.js`**

Import:

```js
import { createMediaRecord, deleteMediaAsset, uploadImage } from "./media.js";
```

Add after session routes:

```js
adminApi.get("/media", requireAdmin, (request, response) => {
  const media = db.prepare("SELECT * FROM media_assets ORDER BY created_at DESC, id DESC").all();
  response.json({ media });
});

adminApi.post("/media", requireAdmin, uploadImage.single("image"), (request, response) => {
  if (!request.file) {
    response.status(400).json({ error: "Image file is required" });
    return;
  }
  response.status(201).json({ media: createMediaRecord(request.file) });
});

adminApi.delete("/media/:id", requireAdmin, async (request, response, next) => {
  try {
    await deleteMediaAsset(Number(request.params.id));
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
```

Also import `db`:

```js
import { db } from "./db.js";
```

- [ ] **Step 3: Add shared error handler in `server.js`**

After API registration and before static fallback:

```js
app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  response.status(error.status || 500).json({ error: error.message || "Server error" });
});
```

- [ ] **Step 4: Add media UI in `public/admin/admin.js`**

Add a click listener for sidebar buttons and a media renderer:

```js
document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (!viewButton) return;
  if (viewButton.dataset.view === "media") renderMediaView();
});

async function renderMediaView() {
  viewTitle.textContent = "媒体库";
  viewBody.innerHTML = `
    <form id="uploadForm" class="panel">
      <input type="file" name="image" accept="image/*" required>
      <button type="submit">上传图片</button>
    </form>
    <div id="mediaGrid" class="media-grid"></div>
  `;
  document.querySelector("#uploadForm").addEventListener("submit", uploadMedia);
  await loadMediaGrid();
}

async function loadMediaGrid() {
  const data = await api("/api/admin/media");
  document.querySelector("#mediaGrid").innerHTML = data.media.map((item) => `
    <article class="media-card">
      <img src="${item.url}" alt="${item.original_name}">
      <strong>${item.original_name}</strong>
      <code>${item.url}</code>
      <button data-delete-media="${item.id}">删除</button>
    </article>
  `).join("");
}

async function uploadMedia(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const response = await fetch("/api/admin/media", { method: "POST", body: formData });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Upload failed: ${response.status}`);
  await loadMediaGrid();
}

document.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-media]");
  if (!deleteButton) return;
  await api(`/api/admin/media/${deleteButton.dataset.deleteMedia}`, { method: "DELETE" });
  await loadMediaGrid();
});
```

- [ ] **Step 5: Add media CSS**

```css
.panel {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.media-card {
  display: grid;
  gap: 8px;
  padding: 12px;
  background: #fff;
  border: 1px solid #deded8;
}

.media-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  background: #f3f3ef;
}
```

- [ ] **Step 6: Verify media library**

Run the app, login, upload a PNG/WebP image, refresh media view.

Expected: image appears; deleting unused uploaded image removes it from the grid and from `uploads/`.

- [ ] **Step 7: Commit**

```bash
git add server public/admin
git commit -m "feat: add admin media library"
```

### Task 7: Products Admin API and UI

**Files:**
- Create: `server/validators.js`
- Modify: `server/admin-api.js`
- Modify: `public/admin/admin.js`
- Modify: `public/admin/admin.css`

- [ ] **Step 1: Create product validator in `server/validators.js`**

```js
export function requireString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(`${field} is required`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

export function requireInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    const error = new Error(`${field} must be an integer`);
    error.status = 400;
    throw error;
  }
  return number;
}

export function normalizeStringList(value, field) {
  if (Array.isArray(value)) return value.map((item) => requireString(item, field));
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}
```

- [ ] **Step 2: Add product routes to `server/admin-api.js`**

Import:

```js
import { normalizeStringList, requireInteger, requireString } from "./validators.js";
```

Add helpers:

```js
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
```

Add routes:

```js
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
    INSERT INTO products (slug, name, category, price, description, colors_json, sizes_json, badge, tone, main_image_id, sort_order, visible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(product.slug, product.name, product.category, product.price, product.description, product.colorsJson, product.sizesJson, product.badge, product.tone, product.mainImageId, product.sortOrder, product.visible);
  response.status(201).json({ id: result.lastInsertRowid });
});

adminApi.put("/products/:id", requireAdmin, (request, response) => {
  const product = readProductPayload(request.body || {});
  const result = db.prepare(`
    UPDATE products
    SET slug = ?, name = ?, category = ?, price = ?, description = ?, colors_json = ?, sizes_json = ?, badge = ?, tone = ?, main_image_id = ?, sort_order = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(product.slug, product.name, product.category, product.price, product.description, product.colorsJson, product.sizesJson, product.badge, product.tone, product.mainImageId, product.sortOrder, product.visible, Number(request.params.id));
  if (result.changes === 0) response.status(404).json({ error: "Product not found" });
  else response.json({ ok: true });
});

adminApi.delete("/products/:id", requireAdmin, (request, response) => {
  const result = db.prepare("DELETE FROM products WHERE id = ?").run(Number(request.params.id));
  if (result.changes === 0) response.status(404).json({ error: "Product not found" });
  else response.json({ ok: true });
});
```

- [ ] **Step 3: Add products UI**

Add `renderProductsView`, list rendering, and form submission in `public/admin/admin.js`. The form should include slug, name, category, price, description, colors, sizes, badge, tone, image id, sort order, and visible checkbox.

Use this body template:

```js
async function renderProductsView() {
  viewTitle.textContent = "商品管理";
  const [productsData, mediaData] = await Promise.all([
    api("/api/admin/products"),
    api("/api/admin/media")
  ]);
  viewBody.innerHTML = `
    <div class="split-editor">
      <div id="productsList"></div>
      <form id="productForm" class="editor-form">
        <input name="id" type="hidden">
        <label>Slug<input name="slug" required></label>
        <label>名称<input name="name" required></label>
        <label>分类<input name="category" required></label>
        <label>价格<input name="price" type="number" required></label>
        <label>描述<textarea name="description" required></textarea></label>
        <label>颜色<input name="colors" placeholder="Black, White"></label>
        <label>尺码<input name="sizes" placeholder="7, 8, 9"></label>
        <label>Badge<input name="badge" value="Carry"></label>
        <label>Tone<input name="tone" value="tone-graphite"></label>
        <label>主图<select name="mainImageId"><option value="">无</option>${mediaData.media.map((item) => `<option value="${item.id}">${item.original_name}</option>`).join("")}</select></label>
        <label>排序<input name="sortOrder" type="number" value="0"></label>
        <label class="checkbox"><input name="visible" type="checkbox" checked> 显示</label>
        <button type="submit">保存商品</button>
      </form>
    </div>
  `;
  renderProductsList(productsData.products);
  document.querySelector("#productForm").addEventListener("submit", saveProduct);
}
```

Add sidebar routing:

```js
if (viewButton.dataset.view === "products") renderProductsView();
```

- [ ] **Step 4: Verify product edit updates storefront**

Run app, login, change a product name, save, refresh front page.

Expected: edited name appears in product grid.

- [ ] **Step 5: Commit**

```bash
git add server public/admin
git commit -m "feat: add admin product management"
```

### Task 8: Homepage Modules Admin API and Storefront Rendering

**Files:**
- Modify: `server/admin-api.js`
- Modify: `public/app.js`
- Modify: `public/index.html`
- Modify: `public/admin/admin.js`
- Modify: `public/admin/admin.css`

- [ ] **Step 1: Replace static homepage module sections with containers**

In `public/index.html`, replace brand logo cards inside `.brand-logo-section` with:

```html
<section class="brand-logo-section" id="brandLogoSection" aria-label="Designer brand logos"></section>
```

Replace `.image-category-section` content with:

```html
<section class="image-category-section" id="imageCategorySection" aria-label="Watch brand image categories"></section>
```

- [ ] **Step 2: Add public home rendering to `public/app.js`**

Add:

```js
async function loadHomeModules() {
  const response = await fetch("/api/public/home");
  if (!response.ok) throw new Error(`Cannot load home modules: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.modules)) throw new Error("Invalid home modules response");
  renderHomeModules(data.modules);
}

function renderHomeModules(modules) {
  const brandLogoSection = document.querySelector("#brandLogoSection");
  const imageCategorySection = document.querySelector("#imageCategorySection");
  if (!brandLogoSection || !imageCategorySection) return;

  brandLogoSection.innerHTML = modules
    .filter((module) => module.moduleType === "brand_logo")
    .map((module) => `<a class="brand-logo-card" href="${module.linkUrl}"><img src="${module.image}" alt="${module.title}"></a>`)
    .join("");

  imageCategorySection.innerHTML = modules
    .filter((module) => module.moduleType === "image_category")
    .map((module, index) => `<a class="image-category-card ${index === 3 || index === 7 ? "wide" : ""}" href="${module.linkUrl}"><img src="${module.image}" alt="${module.title}"><span>${module.title}</span></a>`)
    .join("");
}
```

Change initialization to call both:

```js
Promise.all([loadProducts(), loadHomeModules()])
```

- [ ] **Step 3: Add home module admin routes**

Add to `server/admin-api.js`:

```js
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
  const title = requireString(request.body.title, "title");
  const moduleType = requireString(request.body.moduleType, "moduleType");
  const imageId = request.body.imageId ? requireInteger(request.body.imageId, "imageId") : null;
  const linkUrl = requireString(request.body.linkUrl || "#related", "linkUrl");
  const sortOrder = requireInteger(request.body.sortOrder || 0, "sortOrder");
  const visible = request.body.visible === false ? 0 : 1;
  const result = db.prepare(`
    INSERT INTO home_modules (module_type, title, image_id, link_url, sort_order, visible)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(moduleType, title, imageId, linkUrl, sortOrder, visible);
  response.status(201).json({ id: result.lastInsertRowid });
});

adminApi.put("/home-modules/:id", requireAdmin, (request, response) => {
  const title = requireString(request.body.title, "title");
  const moduleType = requireString(request.body.moduleType, "moduleType");
  const imageId = request.body.imageId ? requireInteger(request.body.imageId, "imageId") : null;
  const linkUrl = requireString(request.body.linkUrl || "#related", "linkUrl");
  const sortOrder = requireInteger(request.body.sortOrder || 0, "sortOrder");
  const visible = request.body.visible === false ? 0 : 1;
  const result = db.prepare(`
    UPDATE home_modules
    SET module_type = ?, title = ?, image_id = ?, link_url = ?, sort_order = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(moduleType, title, imageId, linkUrl, sortOrder, visible, Number(request.params.id));
  if (result.changes === 0) response.status(404).json({ error: "Home module not found" });
  else response.json({ ok: true });
});

adminApi.delete("/home-modules/:id", requireAdmin, (request, response) => {
  const result = db.prepare("DELETE FROM home_modules WHERE id = ?").run(Number(request.params.id));
  if (result.changes === 0) response.status(404).json({ error: "Home module not found" });
  else response.json({ ok: true });
});
```

- [ ] **Step 4: Add home module UI**

Add `renderHomeModulesView` in `public/admin/admin.js`, mirroring product management but using fields `moduleType`, `title`, `imageId`, `linkUrl`, `sortOrder`, `visible`.

Sidebar routing:

```js
if (viewButton.dataset.view === "home") renderHomeModulesView();
```

- [ ] **Step 5: Verify homepage module edit**

Run app, login, change a homepage module title or image, save, refresh storefront.

Expected: homepage module reflects updated data.

- [ ] **Step 6: Commit**

```bash
git add server public
git commit -m "feat: add homepage module management"
```

### Task 9: Hardening, Verification, and Local Preview

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-19-rovenox-admin-backend-design.zh.md` if implementation changes the final behavior.
- Modify: `public/admin/admin.js`
- Modify: `server/*.js`

- [ ] **Step 1: Add `README.md` runbook**

````md
# RoveNox

## 本地运行

```bash
pnpm install
pnpm seed
pnpm dev
```

前台地址：http://127.0.0.1:3000

后台地址：http://127.0.0.1:3000/admin

默认本地后台账号：

- 用户名：`admin`
- 密码：`admin123456`

部署前请通过环境变量设置：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

## 数据目录

- SQLite 数据库：`data/rovenox.db`
- 上传图片：`uploads/`

这两个目录不提交到 git。
````

- [ ] **Step 2: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Run local manual verification**

Run:

```bash
pnpm seed
pnpm dev
```

Verify:

- `http://127.0.0.1:3000` opens the storefront.
- `http://127.0.0.1:3000/admin` opens admin login.
- Admin login works.
- Uploading image works.
- Deleting unused image works.
- Deleting used image is blocked.
- Editing product updates storefront after refresh.
- Editing homepage module updates storefront after refresh.

- [ ] **Step 4: Commit**

```bash
git add README.md docs public server test package.json pnpm-lock.yaml
git commit -m "docs: add RoveNox admin runbook"
```

## Self-Review

- Spec coverage: this plan covers service skeleton, SQLite schema, seeding, public APIs, admin auth, media upload/delete, product CRUD, homepage module CRUD, frontend migration, and verification.
- Deferred scope remains deferred: draft/publish, object storage, CDN, multi-admin, product galleries, analytics, CMS, and framework migration are not included.
- No bulk deletion is required. File moves use `git mv`; generated runtime data stays ignored.
- The plan keeps the first version practical and avoids a full frontend rewrite.
