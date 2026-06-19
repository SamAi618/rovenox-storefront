# RoveNox 轻量后台服务设计

## 目标

把当前 RoveNox 纯静态网站升级成一个轻量服务，并增加一个带密码登录的管理后台。第一版后台用于管理首页图片、商品图片和商品信息，避免以后每次都手动修改 HTML 或 JavaScript。

前台网站的视觉和现有交互尽量保持不变。后台会成为首页内容和商品内容的主要维护入口。

## 已确认的决定

- 做轻量后端后台，不做完整 CMS，也不把项目整体迁移到 Next.js。
- 使用 Node.js、小型 HTTP 框架、SQLite 和原生后台页面。
- 同时管理首页图片模块和商品图片/商品信息。
- 后台保存后立即生效；用户刷新前台后看到最新内容。
- 第一版图片先存放在服务器本地文件夹。
- 结构化数据存放在 SQLite。
- 第一版只做单管理员账号。
- 先在本机开发和测试，完成后再部署到 VPS 或云服务器。
- 草稿/发布流程、对象存储、CDN、多管理员权限先不做，后续再扩展。

## 架构

项目会从纯静态目录升级成一个小型服务：

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

`public/` 用来放现有前台网站和新的后台页面。`uploads/` 用来放后台上传的图片。`data/rovenox.db` 用来保存商品、首页模块、图片记录和管理员设置。`server/` 用来放后端代码，包括数据库、登录、媒体处理和 API。

## 后台页面

### 登录页

第一版只支持一个管理员账号密码登录。密码只保存加密 hash，不保存明文。没有登录时访问 `/admin`，会自动进入登录界面。

### 概览页

显示基础状态：商品数量、图片数量、首页模块数量、最近更新时间。这个页面只做状态概览，不做复杂数据分析。

### 媒体库

媒体库支持：

- 上传图片。
- 预览图片。
- 复制图片 URL。
- 删除未使用的图片。

如果图片正在被商品或首页模块使用，后台必须禁止删除，并明确提示“图片正在被使用”。

### 首页模块

首页模块用于管理网站首页上的视觉内容，例如：

- 品牌 Logo 卡片。
- 手表/分类图片卡片。
- 未来可能增加的 Hero 横幅或活动图。

每个模块保存：模块类型、标题、图片、链接、排序、是否显示。

### 商品管理

商品管理支持新增、编辑、删除、排序、显示/隐藏商品。第一版商品字段包括：

- 商品名称。
- 分类。
- 价格。
- 描述。
- 颜色。
- 尺码。
- 主图。
- 排序。
- 是否显示。

第一版每个商品先支持一张主图。多图相册后续再做。

## 数据模型

### `admin_settings`

保存管理员和站点级设置。

核心字段：

- `id`
- `admin_username`
- `password_hash`
- `created_at`
- `updated_at`

### `media_assets`

保存上传图片的元数据。

核心字段：

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

保存首页可编辑图片模块。

核心字段：

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

保存前台商品数据。

核心字段：

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

## API 设计

### 公开 API

`GET /api/public/home`

返回前台需要展示的首页模块，只返回 `visible = true` 的内容，并按排序字段排列。

`GET /api/public/products`

返回前台商品列表，只返回已显示商品，并按排序字段排列。后续可以扩展 `category` 和搜索参数。

`GET /uploads/:filename`

访问后台上传的图片文件。

### 后台 API

`POST /api/admin/login`

管理员登录。登录成功后写入 session cookie。

`POST /api/admin/logout`

退出登录并清除当前 session。

`GET /api/admin/session`

检查当前浏览器是否已经登录。

`GET /api/admin/media`

获取媒体库图片列表。

`POST /api/admin/media`

上传图片，把文件保存到 `uploads/`，并写入 `media_assets` 数据表。

`DELETE /api/admin/media/:id`

删除未被使用的图片。如果图片正在被商品或首页模块引用，必须拒绝删除。

`GET /api/admin/home-modules`

后台查看所有首页模块。

`POST /api/admin/home-modules`

新增首页模块。

`PUT /api/admin/home-modules/:id`

修改首页模块。

`DELETE /api/admin/home-modules/:id`

删除首页模块。

`GET /api/admin/products`

后台查看全部商品。

`POST /api/admin/products`

新增商品。

`PUT /api/admin/products/:id`

修改商品。

`DELETE /api/admin/products/:id`

删除商品。

## 前台迁移方式

现有前台建议分阶段迁移：

1. 增加 Node 服务、SQLite、静态文件托管、上传目录、登录和 session 基础能力。
2. 把当前前台文件移动到 `public/`，先保证新服务打开后，前台效果和现在一致。
3. 从当前 `app.js` 的商品数组和 `index.html` 里的图片引用导入初始数据到 SQLite。
4. 修改前台，让它从 `/api/public/products` 和 `/api/public/home` 读取数据。
5. 开发后台页面：登录、媒体库、首页模块、商品管理。
6. 本地验证：后台修改后，刷新前台可以看到更新。

迁移期间，当前写死的数据可以短暂保留作为备用。确认 API 读取稳定后，要删除写死商品数据，避免出现两个数据源。

## 错误处理

- 商品或模块 ID 不存在时，返回明确的 404 错误。
- 表单输入不合法时，返回具体校验错误。
- 上传文件类型不支持时，拒绝上传。
- 图片正在被使用时，删除操作必须失败，并显示明确原因。
- 后端错误不能返回假成功。
- 后台页面不能静默失败，要给出可操作的提示。

## 安全要求

- 只保存密码 hash，不保存明文密码。
- 后台 API 必须要求 session 登录。
- 未登录用户不能访问后台操作接口。
- 上传图片要校验文件类型和大小。
- 上传文件只能作为静态文件访问，不能被当成代码执行。
- 多用户和角色权限后续再做。

## 验证标准

第一版完成前，需要确认：

- 前台网站能通过新的 Node 服务正常打开。
- 后台登录可用，未登录时不能访问后台 API。
- 上传图片后，会创建媒体记录，并能通过 `/uploads/` 访问。
- 未使用图片可以删除。
- 正在被商品或首页模块使用的图片不能删除。
- 编辑首页模块后，刷新前台能看到更新。
- 编辑商品名称、分类、价格、描述和主图后，刷新前台能看到更新。
- 被隐藏的商品和首页模块不会出现在前台。

## 暂不做的内容

- 草稿和发布流程。
- 对象存储和 CDN。
- 多管理员账号和角色权限。
- 商品多图相册。
- 高级数据分析。
- 完整 CMS 迁移。
- Next.js 等完整框架迁移。
