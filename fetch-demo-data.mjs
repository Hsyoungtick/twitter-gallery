import { readFileSync, writeFileSync } from 'fs'

const API_BASE = 'http://localhost:3000/api'
const NITTER_URL = 'http://127.0.0.1:8080'
const TARGET_COUNT = 100

const sanitizeUrl = (url) => {
  if (!url) return url
  url = url.replace(new RegExp(NITTER_URL, 'g'), '')
  const encodedMatch = url.match(/^\/pic\/(https?.*)$/)
  if (encodedMatch) {
    try { return decodeURIComponent(encodedMatch[1]) } catch {}
  }
  url = url.replace(/^\/pic\/media%2F/, 'https://pbs.twimg.com/media/')
  url = url.replace(/^\/pic\/amplify_video_thumb%2F/, 'https://pbs.twimg.com/amplify_video_thumb/')
  url = url.replace(/^\/pic\/profile_images%2F/, 'https://pbs.twimg.com/profile_images/')
  url = url.replace(/^\/pic\/ext_tw_video_thumb%2F/, 'https://pbs.twimg.com/ext_tw_video_thumb/')
  if (url.startsWith('/pic/')) {
    try { url = decodeURIComponent(url.replace(/^\/pic\//, '')) } catch {}
  }
  const videoMatch = url.match(/^\/video\/[^/]+\/(https?.*)$/)
  if (videoMatch) {
    try { url = decodeURIComponent(videoMatch[1]) } catch {}
  }
  url = url.replace(/https:\/\/pbs\.twimg\.com\/(amplify_video_thumb|ext_tw_video_thumb|media)\/([^?]+)/, (match, type, path) => {
    try { return `https://pbs.twimg.com/${type}/${decodeURIComponent(path)}` } catch { return match }
  })
  return url
}

const sanitizeMedia = (m) => ({
  ...m,
  tweetUrl: sanitizeUrl(m.tweetUrl),
  url: sanitizeUrl(m.url),
  previewUrl: sanitizeUrl(m.previewUrl),
})

const sanitizeReply = (reply) => ({
  ...reply,
  avatar: sanitizeUrl(reply.avatar),
})

const sanitizeThread = (thread) => ({
  ...thread,
  items: (thread.items || []).map(sanitizeReply),
  replies: (thread.replies || []).map(sanitizeReply),
})

const sanitizeUser = (u) => ({
  ...u,
  avatar: sanitizeUrl(u.avatar),
})

async function fetchAllMedia() {
  console.log(`[demo] 从API抓取 NASA 和 BBCEarth 的媒体数据...`)
  const allMedia = []
  const usersInfo = []

  for (const username of ['NASA', 'BBCEarth']) {
    try {
      const [mediaResp, userResp] = await Promise.all([
        fetch(`${API_BASE}/user/${username}/media`),
        fetch(`${API_BASE}/user/${username}`)
      ])
      const mediaResult = await mediaResp.json()
      const userResult = await userResp.json()
      if (mediaResult.media) {
        allMedia.push(...mediaResult.media)
      }
      usersInfo.push(sanitizeUser(userResult))
      console.log(`[demo] ${username}: ${mediaResult.media?.length || 0} 条媒体`)
    } catch (err) {
      console.error(`[demo] ${username} 媒体抓取失败: ${err.message}`)
    }
  }

  allMedia.sort((a, b) => {
    const dateA = new Date(a.date?.match(/(\w+ \d+, \d+)/)?.[1] || 0)
    const dateB = new Date(b.date?.match(/(\w+ \d+, \d+)/)?.[1] || 0)
    return dateB - dateA
  })

  return { media: allMedia.slice(0, TARGET_COUNT).map(sanitizeMedia), usersInfo }
}

async function fetchReplies(media) {
  console.log(`\n[demo] 抓取 ${media.length} 条推文的评论...`)
  const replies = {}
  let fetched = 0

  for (const m of media) {
    try {
      const resp = await fetch(`${API_BASE}/tweet/${m.author}/status/${m.tweetId}`)
      const result = await resp.json()
      const threads = (result.replyThreads || []).map(sanitizeThread)
      replies[m.tweetId] = threads
      fetched++
      const replyCount = threads.reduce((sum, t) => sum + (t.items?.length || 0) + (t.replies?.length || 0), 0)
      console.log(`[demo] ${fetched}/${media.length} ${m.author}/${m.tweetId} → ${replyCount} 条评论`)
      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      fetched++
      console.error(`[demo] ${m.author}/${m.tweetId} 评论失败: ${err.message}`)
      replies[m.tweetId] = []
    }
  }

  return replies
}

async function main() {
  const { media, usersInfo } = await fetchAllMedia()
  console.log(`\n[demo] 共 ${media.length} 条媒体, ${usersInfo.length} 个用户`)

  const replies = await fetchReplies(media)

  const totalReplies = Object.values(replies).reduce((sum, threads) => {
    return sum + threads.reduce((s, t) => s + (t.items?.length || 0) + (t.replies?.length || 0), 0)
  }, 0)
  console.log(`\n[demo] 评论统计: ${Object.keys(replies).length} 条推文有评论数据, 共 ${totalReplies} 条评论`)

  const demoData = { media, usersInfo, replies }
  writeFileSync('data/demo-data.json', JSON.stringify(demoData, null, 2))
  console.log(`[demo] 完成！已写入 data/demo-data.json`)
}

main().catch(err => {
  console.error('[demo] 致命错误:', err)
  process.exit(1)
})
