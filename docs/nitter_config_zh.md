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

部署完成后，将 Nitter 地址填入配置文件即可。
