# RoveNox Lightweight Admin Backend Design

## Goal

Upgrade the current RoveNox static storefront into a lightweight service with a password-protected admin backend. The first version lets the owner manage homepage images, product images, and product information without editing HTML or JavaScript manually.

The storefront should keep its current visual behavior as much as possible. The admin backend becomes the source of truth for editable homepage content and products.

## Confirmed Decisions

- Build a lightweight backend, not a full CMS and not a full Next.js migration.
- Use Node.js with a small HTTP framework, SQLite, and plain admin pages.
- Manage both homepage image modules and product images/product information.
- Save changes immediately. The storefront updates after users refresh the page.
- Store uploaded images in a local server folder first.
- Store structured data in SQLite.
- Use a single administrator account for the first version.
- Develop and test locally first, then deploy to a VPS or cloud server later.
- Defer draft/publish workflow, object storage, CDN, and multi-admin permissions.

## Architecture

The project changes from a pure static folder into a small service:

```text
复刻网站/
  package.json
  server.js
  data/
    rovenox.db
  uploads/
  public/
    index.html
    styles.css
    app.js
    translations.js
    images/
    admin/
      index.html
      admin.css
      admin.js
  server/
    db.js
    auth.js
    media.js
    public-api.js
    admin-api.js
    seed.js
```

`public/` hosts the existing storefront and the new admin page. `uploads/` stores images uploaded from the admin backend. `data/rovenox.db` stores products, homepage modules, media metadata, and admin settings. `server/` contains backend modules for database access, authentication, media handling, and API routes.

## Admin Pages

### Login

A single administrator signs in with a username and password. Passwords are stored as hashes, not plain text. Unauthenticated users who open `/admin` are redirected to the login view.

### Dashboard

The dashboard shows a compact overview: product count, media count, homepage module count, and last updated time. It is a status page, not an analytics system.

### Media Library

The media library supports:

- Upload image files.
- Preview uploaded images.
- Copy image URL.
- Delete unused images.

Deletion must be blocked when a media item is referenced by a product or homepage module. The admin should see a specific message that the image is currently in use.

### Homepage Modules

Homepage modules manage visual content such as:

- Brand logo cards.
- Watch/category image cards.
- Future hero or banner images.

Each module stores type, title, image, link, sort order, and visible status.

### Product Management

Product management supports create, edit, delete, sort, and show/hide for products. First version product fields:

- Name.
- Category.
- Price.
- Description.
- Colors.
- Sizes.
- Main image.
- Sort order.
- Visible status.

The first version supports one main image per product. Multi-image product galleries are deferred.

## Data Model

### `admin_settings`

Stores administrator and site-level settings.

Core fields:

- `id`
- `admin_username`
- `password_hash`
- `created_at`
- `updated_at`

### `media_assets`

Stores uploaded image metadata.

Core fields:

- `id`
- `filename`
- `original_name`
- `url`
- `mime_type`
- `size_bytes`
- `width`
- `height`
- `created_at`

### `home_modules`

Stores editable homepage visual modules.

Core fields:

- `id`
- `module_type`
- `title`
- `image_id`
- `link_url`
- `sort_order`
- `visible`
- `created_at`
- `updated_at`

### `products`

Stores storefront products.

Core fields:

- `id`
- `slug`
- `name`
- `category`
- `price`
- `description`
- `colors_json`
- `sizes_json`
- `main_image_id`
- `sort_order`
- `visible`
- `created_at`
- `updated_at`

## API Design

### Public API

`GET /api/public/home`

Returns visible homepage modules, grouped or labeled by module type and ordered by `sort_order`.

`GET /api/public/products`

Returns visible products ordered by `sort_order`. It can later support query parameters such as `category` and `q`.

`GET /uploads/:filename`

Serves uploaded image files.

### Admin API

`POST /api/admin/login`

Authenticates the single administrator and creates a session cookie.

`POST /api/admin/logout`

Clears the current session.

`GET /api/admin/session`

Returns whether the current browser session is authenticated.

`GET /api/admin/media`

Lists uploaded media.

`POST /api/admin/media`

Uploads an image, saves it under `uploads/`, and inserts a `media_assets` row.

`DELETE /api/admin/media/:id`

Deletes an unused media asset. It must reject deletion when referenced by `products` or `home_modules`.

`GET /api/admin/home-modules`

Lists all homepage modules for admin editing.

`POST /api/admin/home-modules`

Creates a homepage module.

`PUT /api/admin/home-modules/:id`

Updates a homepage module.

`DELETE /api/admin/home-modules/:id`

Deletes a homepage module.

`GET /api/admin/products`

Lists all products for admin editing.

`POST /api/admin/products`

Creates a product.

`PUT /api/admin/products/:id`

Updates a product.

`DELETE /api/admin/products/:id`

Deletes a product.

## Storefront Migration

The existing storefront should be migrated in phases.

1. Add the Node service, SQLite database, static file hosting, uploads folder, and login/session foundation.
2. Move current storefront files into `public/` while keeping the same UI and behavior.
3. Seed SQLite from the current `app.js` product array and from image references in `index.html`.
4. Change the storefront to fetch `/api/public/products` and `/api/public/home`.
5. Build the admin UI for login, media library, homepage modules, and products.
6. Verify admin changes by refreshing the storefront after edits.

During migration, the current hardcoded storefront data may remain as a temporary fallback. Once API loading is verified, the hardcoded product source should be removed to avoid two sources of truth.

## Error Handling

- Unknown product or module IDs should return explicit 404 errors.
- Invalid form input should return specific validation errors.
- Uploads should reject unsupported file types.
- Media deletion should fail clearly when the image is in use.
- Backend errors should not produce fake success responses.
- Admin pages should show actionable messages instead of silently failing.

## Security

- Store password hashes only.
- Keep admin APIs behind session authentication.
- Do not expose admin endpoints to unauthenticated requests.
- Validate uploaded file type and size.
- Serve uploaded files as static files only; do not execute uploaded content.
- Defer multi-user roles until a later version.

## Verification

Before considering the first version complete:

- The storefront still opens through the new Node service.
- Admin login works and blocks unauthenticated admin API access.
- Uploading an image creates a media record and serves the file from `/uploads/`.
- Deleting an unused image works.
- Deleting an image referenced by a product or homepage module is blocked.
- Editing a homepage module updates the storefront after refresh.
- Editing product name, category, price, description, and main image updates the storefront after refresh.
- Hidden products and hidden homepage modules do not appear on the public storefront.

## Deferred Work

- Draft and publish workflow.
- Object storage and CDN.
- Multi-admin users and role permissions.
- Product galleries with multiple images.
- Advanced analytics.
- Full CMS migration.
- Full framework migration such as Next.js.
