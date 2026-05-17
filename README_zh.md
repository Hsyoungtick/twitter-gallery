<div align="center">

### Twitter Gallery

基于 [Nitter](https://github.com/zedeus/nitter) 的一个瀑布流形式的 Twitter/X 媒体画廊浏览器

中文 / [English](README.md)

![Preview](/images/preview1.png)

![Preview](/images/preview2.png)

</div>



## 🚀快速开始

### 1. Nitter 实例部署

本项目依赖 Nitter 作为 Twitter 数据源。你可以按照以下步骤部署：

1. 拉取 Nitter 项目
   ```bash
   git clone https://github.com/zedeus/nitter.git
   ```
2. 创建 `nitter.conf` 文件

   重点关注以下配置：

   - `hostname = "127.0.0.1:8080"`：生成链接用的域名 IP
   - `hmacKey = "3f8b2d7e1a9c4560f3a7d2e9b1c4f6083b5e7d9d2c4f801a357b9e1d3f579b2c"`：随便让豆包生成一个随机密钥
   - `proxy = "http://host.docker.internal:7890"`：如果不可直连 twitter，需要配置代理地址
   - `hlsPlayback = true`：启用 HLS 视频流播放

   示例：

   ```conf
   [Server]
   hostname = "127.0.0.1:8080"      # for generating links, change this to your own domain/ip
   title = "nitter"
   address = "0.0.0.0"
   port = 8080
   https = false                # disable to enable cookies when not using https
   httpMaxConnections = 100
   staticDir = "./public"

   [Cache]
   listMinutes = 240            # how long to cache list info (not the tweets, so keep it high)
   rssMinutes = 10              # how long to cache rss queries
   redisHost = "nitter-redis"      # Change to "nitter-redis" if using docker-compose
   redisPort = 6379
   redisPassword = ""
   redisConnections = 20        # minimum open connections in pool
   redisMaxConnections = 30
   # new connections are opened when none are available, but if the pool size
   # goes above this, they're closed when released. don't worry about this unless
   # you receive tons of requests per second

   [Config]
   hmacKey = "3f8b2d7e1a9c4560f3a7d2e9b1c4f6083b5e7d9d2c4f801a357b9e1d3f579b2c"        # random key for cryptographic signing of video urls
   base64Media = false          # use base64 encoding for proxied media urls
   enableRSS = true             # master switch, set to false to disable all RSS feeds
   enableRSSUserTweets = true   # /@user/rss
   enableRSSUserReplies = true  # /@user/with_replies/rss
   enableRSSUserMedia = true    # /@user/media/rss
   enableRSSSearch = true       # /search/rss and /@user/search/rss
   enableRSSList = true         # list RSS feeds
   enableDebug = false          # enable request logs and debug endpoints (/.sessions)
   proxy = "http://host.docker.internal:7890"                   # http/https url, SOCKS proxies are not supported
   proxyAuth = ""
   apiProxy = ""                # nitter-proxy host, e.g. localhost:7000
   disableTid = false           # enable this if cookie-based auth is failing
   maxConcurrentReqs = 2        # max requests at a time per session to avoid race conditions
   maxRetries = 1               # max number of retries on rate limit errors
   retryDelayMs = 150           # delay in ms between retries

   # Change default preferences here, see src/prefs_impl.nim for a complete list
   [Preferences]
   theme = "Nitter"
   replaceTwitter = "nitter.net"
   replaceYouTube = "piped.video"
   replaceReddit = "teddit.net"
   proxyVideos = true
   hlsPlayback = true
   infiniteScroll = false
   ```
      
3. 获取 X/Twitter Cookies

   1. 打开浏览器，登录你的 X/Twitter 账号。
   2. 按 F12 打开开发者工具。
   3. 进入 Application / 应用 / Storage / 存储。
   4. 找到 Cookies。
   5. 查看 https://x.com 或 https://twitter.com 下的 Cookie。
   6. 复制下面几个值：auth_token, ct0, twid

4. 创建 `sessions.jsonl` 文件

   - 写入下面内容，并替换成你自己的信息：
   ```jsonl
   {"kind":"cookie","username":"你的推特用户名（英文加数字，不带@）","id":"你的twid","auth_token":"你的auth_token","ct0":"你的ct0"}
   ```

5. 启动容器

   ```bash
   docker-compose up -d
   ```

部署完成后，将 Nitter 地址填入 `.env` 配置文件即可。



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
| `NITTER_URL` | Nitter 实例地址 | `http://127.0.0.1:8080` |
| `PORT` | 后端服务端口 | `3000` |

根据实际情况编辑 `.env` 文件，填写你的 Nitter 实例地址和后端端口。

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

## 💻一键启动 & 开机自启（PM2）

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

## 🏗️项目结构

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

## 致谢

- 参考了 [twitter-media-gallery](https://github.com/sajjadalis/twitter-media-gallery) 的思路

## 免责声明

本项目由 AI 辅助生成，介意者请慎用。
