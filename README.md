<div align="center">

### Twitter Gallery

A masonry-style Twitter/X media gallery browser based on [Nitter](https://github.com/zedeus/nitter)

[中文](README_zh.md) / English

![Preview](/images/preview1.png)

![Preview](/images/preview2.png)

[Online Demo](https://twitter-gallery.hsyng.town/)

</div>

## 💻 Features

- Masonry-style media content display
- In-page popup for tweet details
- Unfolded, hierarchical tweet reply display
- @ID automatically displayed as nickname
- Quick links to source URLs everywhere
- Local caching to avoid repeated requests
- Bilingual support (Chinese & English)

## 🚀 Quick Start

### 1. Deploy Nitter Instance

This project depends on Nitter as the Twitter data source. Follow these steps to deploy (Docker deployment recommended):

1. Clone the Nitter project
   ```bash
   git clone https://github.com/zedeus/nitter.git
   ```
2. Create a `nitter.conf` file

   Key configurations to focus on:

   - `hostname = "127.0.0.1:8080"`: Domain/IP for generating links
   - `hmacKey = "3f8b2d7e1a9c4560f3a7d2e9b1c4f6083b5e7d9d2c4f801a357b9e1d3f579b2c"`: Generate a random key
   - `proxy = "http://host.docker.internal:7890"`: Proxy address if you cannot directly connect to Twitter
   - `hlsPlayback = true`: Enable HLS video stream playback

   Sample:

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
      
3. Get X/Twitter Cookies

   1. Open your browser and log in to your X/Twitter account.
   2. Press F12 to open Developer Tools.
   3. Go to Application / Storage.
   4. Find Cookies.
   5. Look under https://x.com or https://twitter.com.
   6. Copy the following values: auth_token, ct0, twid

4. Create a `sessions.jsonl` file

   - Write the following content, replacing with your own information:
   ```jsonl
   {"kind":"cookie","username":"your_twitter_username_alphanumeric_without_at","id":"your_twid","auth_token":"your_auth_token","ct0":"your_ct0"}
   ```

5. Start the container

   ```bash
   docker-compose up -d
   ```

Once deployed, fill in the Nitter address in the `.env` configuration file.



### 2. Clone the Project

```bash
git clone https://github.com/Hsyoungtick/twitter-gallery.git
cd twitter-gallery
```

### 3. Configure Environment Variables

Frontend:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE` | Backend API address | `http://localhost:3000/api` |
| `VITE_PORT` | Frontend dev/preview port | `5173` |

Backend:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NITTER_URL` | Nitter instance address | `http://127.0.0.1:8080` |
| `PORT` | Backend server port | `3000` |

### 4. Install Dependencies

```bash
# Frontend
pnpm install

# Backend
cd backend
pnpm install
```

### 5. Start Development Server

```bash
# From the project root, start both frontend and backend
pnpm start
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend
pnpm start

# Terminal 2 - Frontend
pnpm dev
```

Visit http://localhost:5173 to use the app.

- Click the user icon in the top right to import followed users. Supports batch import, one username per line.
- Click the refresh button in the top right to update followed users' media content. The more users you follow, the longer it takes due to Nitter limitations.
- Click a user in the following list to filter and view only that user's media content.

## ⚡ One-Click Start & Auto-Start (PM2)

Use [PM2](https://pm2.keymetrics.io/) for production deployment with one-click start and boot auto-start.

### Prerequisites

```bash
npm install -g pm2 pm2-windows-startup
```

### One-Click Start

```bash
pnpm pm2:start
```

This will automatically build the frontend and start both backend and frontend via PM2.

### Boot Auto-Start

```bash
# Register PM2 as a Windows service (run as Administrator)
pm2-startup install

# Start the app
pnpm pm2:start

# Save the process list so it auto-restores on boot
pm2 save
```

## 🏗️ Project Structure

```
twitter-gallery/
├── backend/                # Backend service
│   ├── data/               # SQLite database (auto-created, gitignored)
│   ├── db.js               # Database operations
│   ├── index.js            # Express server entry
│   ├── .env.example        # Backend env template
│   └── package.json
├── src/                    # Frontend source
│   ├── components/         # Vue components
│   │   ├── AddUserModal.vue
│   │   ├── FollowingModal.vue
│   │   ├── Header.vue
│   │   ├── MediaGrid.vue
│   │   ├── Modal.vue
│   │   └── UserCard.vue
│   ├── composables/        # Vue composables
│   │   └── useFollowing.js
│   ├── pages/              # Page components
│   │   └── Gallery.vue
│   ├── utils/              # Utility functions
│   │   └── api.js          # API request wrapper
│   ├── router/             # Router configuration
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── .env.example            # Frontend env template
├── .gitignore
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Acknowledgments

- Inspired by [twitter-media-gallery](https://github.com/sajjadalis/twitter-media-gallery)

## Disclaimer

This project was generated with the assistance of AI. If you have concerns about AI-generated code, please consider this before using it.
