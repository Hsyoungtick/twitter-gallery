import { readFileSync, writeFileSync } from 'fs'

const API_BASE = 'http://localhost:3000/api'
const NITTER_URL = 'http://127.0.0.1:8080'

const data = JSON.parse(readFileSync('demo-data.json', 'utf-8').replace(/^\uFEFF/, ''))

const media = data.media.slice(0, 50)

console.log(`[demo] 抓取 ${media.length} 条推文的评论...`)

const tweetReplies = {}
let fetched = 0

for (const m of media) {
  try {
    const resp = await fetch(`${API_BASE}/tweet/${m.author}/status/${m.tweetId}`)
    const result = await resp.json()
    tweetReplies[m.tweetId] = result.replyThreads || []
    fetched++
    console.log(`[demo] ${fetched}/${media.length} ${m.author}/${m.tweetId} → ${(result.replyThreads || []).length} 条评论线程`)
    await new Promise(r => setTimeout(r, 500))
  } catch (err) {
    fetched++
    console.error(`[demo] ${m.author}/${m.tweetId} 失败: ${err.message}`)
    tweetReplies[m.tweetId] = []
  }
}

// 替换URL中的Nitter地址为相对路径
const sanitizeUrl = (url) => {
  if (!url) return url
  url = url.replace(new RegExp(NITTER_URL, 'g'), '')
  // /pic/https%3A%2F%2Fpbs.twimg.com%2F... → 解码为 https://pbs.twimg.com/...
  const encodedMatch = url.match(/^\/pic\/(https?.*)$/)
  if (encodedMatch) {
    try { return decodeURIComponent(encodedMatch[1]) } catch {}
  }
  // /pic/media%2Fxxx.jpg → https://pbs.twimg.com/media/xxx.jpg
  url = url.replace(/^\/pic\/media%2F/, 'https://pbs.twimg.com/media/')
  // /pic/amplify_video_thumb%2F → https://pbs.twimg.com/amplify_video_thumb/
  url = url.replace(/^\/pic\/amplify_video_thumb%2F/, 'https://pbs.twimg.com/amplify_video_thumb/')
  // /pic/profile_images%2Fxxx → https://pbs.twimg.com/profile_images/xxx
  url = url.replace(/^\/pic\/profile_images%2F/, 'https://pbs.twimg.com/profile_images/')
  // 解码剩余的 %2F 等
  if (url.includes('%2F') || url.includes('%3A')) {
    try { url = decodeURIComponent(url) } catch {}
  }
  // /video/ → keep as is (videos won't work in demo)
  return url
}

const sanitizeMedia = media.map(m => ({
  ...m,
  tweetUrl: sanitizeUrl(m.tweetUrl),
  url: sanitizeUrl(m.url),
  previewUrl: sanitizeUrl(m.previewUrl),
}))

const sanitizeReply = (reply) => ({
  ...reply,
  avatar: sanitizeUrl(reply.avatar),
})

const sanitizeThread = (thread) => ({
  ...thread,
  items: (thread.items || []).map(sanitizeReply),
  replies: (thread.replies || []).map(sanitizeReply),
})

const sanitizeReplies = {}
for (const [tweetId, threads] of Object.entries(tweetReplies)) {
  sanitizeReplies[tweetId] = threads.map(sanitizeThread)
}

const usersInfo = data.usersInfo.map(u => ({
  ...u,
  avatar: sanitizeUrl(u.avatar),
}))

const demoData = {
  media: sanitizeMedia,
  usersInfo,
  replies: sanitizeReplies,
}

writeFileSync('public/demo-data.json', JSON.stringify(demoData, null, 2))
console.log(`[demo] 完成！导出 ${sanitizeMedia.length} 条媒体, ${Object.keys(sanitizeReplies).length} 条评论数据`)
