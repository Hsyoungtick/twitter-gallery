<div align="center">

### 推特画廊

基于 [Nitter](https://github.com/zedeus/nitter) 的瀑布流 Twitter/X 媒体画廊浏览器

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

### 前置条件

- 部署 [Nitter 实例](docs/nitter_config_zh.md)

### 方式一：Docker 部署（推荐）

```bash
docker run -d --name twitter-gallery -p 5173:5173 -v "${PWD}/twitter-gallery/data:/app/data" -e NITTER_URL=http://nitter:8080 --restart unless-stopped ghcr.io/hsyoungtick/twitter-gallery:latest
```

访问 http://localhost:5173 即可使用。

### 方式二：手动部署

```bash
git clone https://github.com/Hsyoungtick/twitter-gallery.git
cd twitter-gallery

# 配置环境变量
cp .env.example .env
cp backend/.env.example backend/.env

# 安装依赖
pnpm install
cd backend && pnpm install && cd ..

# 启动开发服务器
pnpm start
```

## 🏗️ 项目结构

```
twitter-gallery/
├── backend/                # 后端服务
│   ├── db.js               # 数据库操作层
│   ├── index.js            # Express 服务入口
│   └── package.json
├── data/                   # SQLite 数据库（自动创建）
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   ├── composables/        # Vue 组合式函数
│   ├── pages/              # 页面组件
│   └── utils/              # 工具函数
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## ✨ 灵感来源

- [twitter-media-gallery](https://github.com/sajjadalis/twitter-media-gallery)

## 🤖 免责声明

本项目由 AI 辅助生成，介意者请慎用。

## 📝 许可证

[MIT](LICENSE)
