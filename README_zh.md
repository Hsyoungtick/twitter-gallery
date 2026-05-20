<div align="center">

### 推特画廊

基于 [Nitter](https://github.com/zedeus/nitter) 的一个瀑布流形式的 Twitter/X 媒体画廊浏览器

[English](README.md) / 中文

![Preview](/images/preview1.png)

![Preview](/images/preview2.png)

[在线演示](https://twitter-gallery.hsyng.town/)

</div>

## 💻 功能

- 瀑布流形式展示媒体内容
- 页内弹窗形式展示推文详情
- 无折叠、层级化的推文评论展示
- @ID 自动显示为昵称
- 各处都能快捷跳转到源 URL
- 本地缓存，避免重复请求
- 中英文双语支持

## 🚀 快速开始

### 1. Nitter 实例部署

请参考 [Nitter 配置](docs/nitter_config_zh.md) 部署 Nitter 实例。

### 2. 克隆项目

```bash
git clone https://github.com/Hsyoungtick/twitter-gallery.git
cd twitter-gallery
```

### 3. 配置环境变量

前端：

```bash
cp .env.example .env
```

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE` | 后端 API 地址 | `http://localhost:3000/api` |
| `VITE_PORT` | 前端开发/预览端口 | `5173` |

后端：

```bash
cp backend/.env.example backend/.env
```

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NITTER_URL` | **Nitter 实例地址** | `http://127.0.0.1:8080` |
| `PORT` | 后端服务端口 | `3000` |

### 4. 安装依赖

```bash
# 前端
pnpm install

# 后端
cd backend
pnpm install
```

### 5. 启动开发服务器

```bash
# 在项目根目录，同时启动前端和后端
pnpm start
```

或分别启动：

```bash
# 终端1 - 后端
cd backend
pnpm start

# 终端2 - 前端
pnpm dev
```

访问 http://localhost:5173 即可使用。

- 点击右上角的用户按钮导入关注用户，目前只能一个个导入，源于 nitter 和 twitter 的限制。
- 点击右上角的刷新按钮更新关注用户的媒体内容，关注越多耗时越长，源于 nitter 的限制。
- 点击关注列表中的用户，可以只查看该用户的媒体内容。

## ⚡ 一键启动 & 开机自启（PM2）

使用 [PM2](https://pm2.keymetrics.io/) 实现生产环境一键启动和开机自启。

### 前置条件

```bash
npm install -g pm2 pm2-windows-startup
```

### 一键启动

```bash
pnpm pm2:start
```

会自动构建前端并通过 PM2 启动后端和前端服务。

### 开机自启

```bash
# 将 PM2 注册为 Windows 服务（需以管理员身份运行）
pm2-startup install

# 启动应用
pnpm pm2:start

# 保存进程列表，开机时自动恢复
pm2 save
```

## 🏗️ 项目结构

```
twitter-gallery/
├── backend/                # 后端服务
│   ├── data/               # SQLite 数据库（自动创建，已 gitignore）
│   ├── db.js               # 数据库操作层
│   ├── index.js            # Express 服务入口
│   ├── .env.example        # 后端环境变量模板
│   └── package.json
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   │   ├── AddUserModal.vue
│   │   ├── FollowingModal.vue
│   │   ├── Header.vue
│   │   ├── MediaGrid.vue
│   │   ├── Modal.vue
│   │   └── UserCard.vue
│   ├── composables/        # Vue 组合式函数
│   │   └── useFollowing.js
│   ├── pages/              # 页面组件
│   │   └── Gallery.vue
│   ├── utils/              # 工具函数
│   │   └── api.js          # API 请求封装
│   ├── router/             # 路由配置
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── .env.example            # 前端环境变量模板
├── .gitignore
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## ✨ 灵感来源

- [twitter-media-gallery](https://github.com/sajjadalis/twitter-media-gallery): 通过推特官方 API 获取推特内容中的媒体资源（图片 + 视频），并以瀑布流布局展示

## 🤖 免责声明

本项目由 AI 辅助生成，介意者请慎用。

## 📝 许可证

[MIT](LICENSE)