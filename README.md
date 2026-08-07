# ZenPortal

个人主页 + 技术博客，一套轻量的内容站点。

## 功能

- 🧱 **主页构建器** — Hero / About / SocialLinks / FeaturedPosts 等 block 自由组合
- 📝 **博客** — Markdown 写作，支持 GFM 表格、代码高亮、原始 HTML
- 💬 **评论区** — 基于 IP 匿名标识，评论需后台审核后展示
- 🖼️ **媒体管理** — 图片/视频/音频上传，自动检测引用、清理未使用文件
- 🔐 **管理后台** — Token 鉴权，独立路径 `/my-admin-path`，博客 CRUD + 评论审核 + 媒体管理
- 🐳 **Docker 部署** — 前后端 + PostgreSQL 一键启动，开发热重载 / 生产静态构建双模式

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + react-markdown |
| 后端 | NestJS + TypeScript + Prisma ORM |
| 数据库 | PostgreSQL 16 |
| 部署 | Docker Compose，dev/prod 双配置 |

## 项目结构

```
zenportal/
├── backend/
│   ├── prisma/              # Schema + 迁移文件
│   ├── prisma.config.ts     # Prisma v7 数据库连接配置
│   └── src/
│       ├── main.ts          # 入口: helmet / CORS / 全局过滤器 / 静态资源
│       ├── app.module.ts    # 根模块
│       ├── common/          # 过滤器、拦截器、守卫、工具函数
│       │   ├── decorators/  # @ClientIp 装饰器
│       │   ├── filters/     # 全局异常 + Prisma 错误处理
│       │   ├── guards/      # Admin Token 鉴权
│       │   ├── interceptors/ # 响应包装 + 请求 ID
│       │   └── utils/       # 访客 ID 生成 (SHA256 + SALT)
│       ├── config/          # Prisma 服务 + PrismaPg adapter
│       └── modules/
│           ├── posts/       # 文章 CRUD + DTO 校验
│           ├── comments/    # 评论 (公开 + 管理，全部需审核)
│           ├── layout/      # 页面布局 (blocks + DTO 校验)
│           ├── media/       # 文件上传/管理/引用检测 (存储挂载卷)
│           ├── site/        # 站点配置
│           └── admin/       # 管理模块汇总
├── frontend/
│   ├── nginx.conf           # 生产 Nginx (API + Media 反代，50MB 上传)
│   └── src/
│       ├── main.tsx         # 入口 (BrowserRouter + future flags)
│       ├── App.tsx          # 路由 + 管理后台密路径
│       ├── registry.ts      # block 类型注册表
│       ├── vite-env.d.ts    # Vite 客户端类型
│       ├── blocks/          # 页面构建器块组件
│       │   ├── Hero.tsx     # 头图 + 标题 + 头像
│       │   ├── AboutMe.tsx  # 个人介绍 (content)
│       │   ├── SocialLinks.tsx # 社交链接 (platform/url)
│       │   ├── FeaturedPosts.tsx # 精选文章
│       │   └── Divider.tsx  # 分割线
│       ├── pages/           # 页面
│       │   ├── HomePage.tsx     # 首页 (blocks 渲染)
│       │   ├── BlogPage.tsx     # 博客列表
│       │   └── PostPage.tsx     # 文章详情 + 评论区
│       ├── admin/           # 管理后台
│       │   ├── AdminPage.tsx    # Tab 导航 (Posts/Media/Comments/Layout)
│       │   ├── AdminPosts.tsx   # 文章列表 + ID 复制
│       │   ├── AdminMedia.tsx   # 媒体管理 (上传/lightbox/引用检测)
│       │   ├── AdminComments.tsx # 评论审核 (批量操作)
│       │   ├── AdminLayout.tsx  # 页面布局编辑器 (JSON + 行号)
│       │   ├── PostEditor.tsx   # 文章编辑 (Edit/Preview 双栏)
│       │   ├── AdminGuard.tsx   # 后台登录守卫
│       │   ├── Lightbox.tsx     # 媒体预览灯箱
│       │   ├── UnreferencedPanel.tsx # 未引用文件面板
│       │   ├── layoutJson.ts    # 布局 JSON 校验纯函数
│       │   └── usePosts.ts / useComments.ts / useMedia.ts  # 业务逻辑 hooks
│       ├── hooks/           # 公开页 hooks
│       │   ├── usePosts.ts      # 博客列表/详情
│       │   ├── useComments.ts   # 评论区
│       │   └── useLayout.ts     # 首页布局
│       ├── components/      # 通用组件
│       │   ├── MarkdownRenderer.tsx # Markdown 渲染 (react-markdown + 高亮)
│       │   ├── PageRenderer.tsx    # blocks 渲染
│       │   ├── CommentSection.tsx  # 评论区
│       │   ├── PostCard.tsx        # 文章卡片
│       │   ├── ConfirmDialog.tsx   # 确认弹窗 (可自定义按钮文案)
│       │   ├── Pagination.tsx      # 分页 (buildPages 纯函数)
│       │   ├── Skeleton.tsx        # 加载骨架屏
│       │   └── Layout.tsx          # 公共布局
│       ├── utils/           # getVisitorColor / getDisplayName
│       └── api/             # client + comments / layout / media / posts
├── scripts/
│   └── setup.js             # 从根 .env 生成子目录 .env
├── package.json             # npm workspaces 根配置
├── .env.example             # 统一环境变量模板
├── .dockerignore            # Docker 构建排除规则
├── docker-compose.yml       # 基础服务编排 (prod 默认)
├── docker-compose.dev.yml   # 开发热重载覆盖层
└── docker-compose.prod.yml  # 生产端口映射
```

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env — 修改敏感值：DB_PASSWORD、ADMIN_TOKEN、VISITOR_SALT

# 生成子目录 .env 文件（仅非 Docker 裸跑开发需要，Docker 模式 skips）
npm run setup
```

关键变量说明：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `NPM_REGISTRY` | `https://registry.npmmirror.com` | npm 镜像源，置空 = npm 官方源 |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `postgres` / `postgres` / `zenportal` | 数据库连接，docker-compose 自动拼接 `DATABASE_URL` |
| `ADMIN_TOKEN` | `change-me-...` | 管理后台 API 鉴权令牌，用户自定义强密码 |
| `VISITOR_SALT` | `change-me-...` | 访客 ID 哈希盐值，用于评论区匿名标识，建议 `openssl rand -hex 32` 生成强随机令牌 |
| `VITE_API_BASE_URL` | `http://localhost:3000/api` | 前端请求的后端地址 |
| `VITE_ADMIN_SECRET_PATH` | `my-admin-path` | 管理后台访问路径前缀，改为自己独有的路径（不要在公共场合暴露） |
| `MEDIA_MAX_IMAGE_SIZE_MB` | `10` | 图片上传大小上限 (MB) |
| `MEDIA_MAX_VIDEO_SIZE_MB` | `50` | 视频上传大小上限 (MB) |
| `MEDIA_MAX_AUDIO_SIZE_MB` | `10` | 音频上传大小上限 (MB) |

### 2. 启动 Docker

```bash
# 开发模式 (热重载) — 前端 :5173，后端 :3000
npm run start:dev

# 生产模式 — 前端 Nginx 静态构建
npm run start
```

数据库初始化（仅首次，或 schema 变更后）：

```bash
# 1. 先起 PostgreSQL
docker compose up -d postgres

# 2. 本地生成 Prisma migration 文件
cd backend && npx prisma migrate dev --name init && cd ..

# 3. 全量重建（migration 会在容器启动时自动执行）
docker compose down -v  # ⚠️ 这会删除所有数据库数据，慎用！
docker compose up -d --build
```

> 之后每次 schema 变更，重复以上三步即可。`prisma migrate deploy` 已内置在 Dockerfile CMD 中，容器启动自动跑。

### 3. 访问

| 服务 | 开发 | 生产 |
|---|---|---|
| 前端 | http://localhost:5173 | http://localhost:5173 |
| 后端 API | http://localhost:3000 | (nginx 代理 /api/) |
| 管理后台 | http://localhost:5173/my-admin-path | http://localhost:5173/my-admin-path |
| PostgreSQL | localhost:5432 | localhost:5432 |

### 4. 停止

```bash
npm run stop
```

## API 接口

### 公开

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/site` | 站点配置 |
| GET | `/api/posts?page=1&pageSize=10` | 博客列表 (已发布) |
| GET | `/api/posts/:slug` | 文章详情 |
| GET | `/api/posts/:slug/comments` | 文章评论 (已审核) |
| POST | `/api/posts/:slug/comments` | 提交评论 |
| GET | `/api/layout/:pageSlug` | 页面布局 |

### 管理 (需 `X-Admin-Token` 请求头)

| 方法 | 路径 | 说明 |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/admin/posts` | 文章 CRUD |
| GET | `/api/admin/comments` | 评论列表 |
| PUT | `/api/admin/comments/:id/approve` | 通过评论 |
| DELETE | `/api/admin/comments/:id` | 删除评论 |
| GET/POST/DELETE | `/api/admin/media` | 媒体管理 |
| PUT | `/api/admin/layout/:pageSlug` | 更新页面布局 |
| PUT | `/api/admin/site` | 更新站点配置 |

## 页面构建器

页面内容通过 `blocks` JSON 数组定义，存储在 `page_layouts` 表中。每个 block 包含 `type` 和 `props`：

```json
[
  {
    "type": "Hero",
    "props": {
      "title": "Hello, I'm Zen",
      "subtitle": "Full-stack developer & writer",
      "avatar": "/media/avatar.jpg"
    }
  },
  {
    "type": "SocialLinks",
    "props": {
      "links": [
        { "platform": "GitHub", "url": "https://github.com/3badguys" },
        { "platform": "Twitter", "url": "https://twitter.com/3badguys" },
        { "platform": "LinkedIn", "url": "https://linkedin.com/in/3badguys" }
      ]
    }
  },
  {
    "type": "AboutMe",
    "props": {
      "content": "Hi! I'm a passionate developer who loves building things for the web.\n\nThis is my personal site where I share thoughts, projects, and tutorials."
    }
  },
  {
    "type": "Divider",
    "props": {}
  },
  {
    "type": "FeaturedPosts",
    "props": {
      "title": "Featured Posts",
      "postIds": ["<post-uuid-1>", "<post-uuid-2>"]
    }
  }
]
```

Block 组件位于 `frontend/src/blocks/`，导出 `blockType` 常量即自动注册。

## 评论区设计

- 访客身份：基于 `IP + SALT` 的 SHA256 哈希生成 `visitor_xxxxxxxx` 匿名标识
- 审核策略：同一 IP 至少有一条已通过评论后，后续评论自动放行
- 前端展示：访客颜色由哈希值映射到 HSL 色环，同一访客所有评论同色
- 支持嵌套回复（`parentId`）

## 后端

### 全局基础设施

- **请求 ID**：每个请求自动生成 `X-Request-Id`，日志可追踪
- **统一响应**：`{ code, message, data }` 格式
- **异常过滤**：`HttpException` → 对应状态码；未预期错误 → 500 + 日志
- **Prisma 异常过滤**：`P2002` 唯一冲突 → 409，`P2003` 外键失败 → 400，`P2025` 记录不存在 → 404
- **DTO 校验**：`class-validator` + `ValidationPipe`，自动 `whitelist` 去除非白名单字段
- **优雅关闭**：SIGTERM/SIGINT → 关闭 HTTP 监听 → 断开 Prisma → 退出
- **生产环境保护**：`NODE_ENV=production` 时未设 `ADMIN_TOKEN` 直接返回 401
