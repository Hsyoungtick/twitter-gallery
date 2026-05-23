import express from 'express'
import cors from 'cors'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { existsSync } from 'fs'

// 确保日志实时输出
if (process.stdout._handle?.setBlocking) process.stdout._handle.setBlocking(true)

import { initDB, upsertUsers, upsertUser, upsertPosts, getUsersByUsernames, getPostsByUsernames, getPostsCountByUser, deleteUser, getUser, upsertUsernameMapBatch, resolveUsernames, deletePostsByUser, cleanupNonFollowing, dbRowToUser, getFollowingList, addFollowing, addFollowingBatch, removeFollowing } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

config({ path: join(__dirname, '.env') })
config({ path: join(__dirname, '..', '.env'), override: true })

const app = express()
const PORT = process.env.PORT || 3000
const NITTER_URL = process.env.NITTER_URL || 'http://127.0.0.1:8080'

if (process.env.NODE_ENV !== 'production') {
  app.use(cors())
}
app.use(express.json())

const DIST_PATH = join(__dirname, '..', 'dist')
if (process.env.NODE_ENV === 'production' && existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH))
}

function stripImageParams(url) {
  if (!url) return url
  return url.replace(/(\.(jpg|jpeg|png|gif|webp|bmp|svg))(?:\?[^/]*|%3[Ff].*)$/i, '$1')
}

app.use('/video', async (req, res) => {
  try {
    const targetUrl = `${NITTER_URL}/video${req.url}`
    const response = await axios.get(targetUrl, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })
    res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp2t')
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length'])
    }
    response.data.pipe(res)
  } catch (error) {
    console.error('[proxy /video] Error:', error.message)
    res.status(502).json({ error: 'Proxy error' })
  }
})

app.use('/pic', async (req, res) => {
  try {
    const targetUrl = `${NITTER_URL}/pic${req.url}`
    const response = await axios.get(targetUrl, {
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg')
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length'])
    }
    response.data.pipe(res)
  } catch (error) {
    console.error('[proxy /pic] Error:', error.message)
    res.status(502).json({ error: 'Proxy error' })
  }
})

// 获取关注列表
app.get('/api/following', (req, res) => {
  try {
    const list = getFollowingList()
    res.json({ followingList: list })
  } catch (error) {
    console.error('[following] 读取失败:', error.message)
    res.status(500).json({ error: 'Failed to read following list' })
  }
})

app.post('/api/following/add', (req, res) => {
  try {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: '需要提供用户名' })
    addFollowing(username)
    const list = getFollowingList()
    res.json({ followingList: list })
  } catch (error) {
    console.error('[following] 添加失败:', error.message)
    res.status(500).json({ error: 'Failed to add following' })
  }
})

app.post('/api/following/add-batch', (req, res) => {
  try {
    const { usernames } = req.body
    if (!usernames?.length) return res.status(400).json({ error: '需要提供用户名列表' })
    addFollowingBatch(usernames)
    const list = getFollowingList()
    res.json({ followingList: list })
  } catch (error) {
    console.error('[following] 批量添加失败:', error.message)
    res.status(500).json({ error: 'Failed to batch add following' })
  }
})

app.post('/api/following/remove', (req, res) => {
  try {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: '需要提供用户名' })
    removeFollowing(username)
    deletePostsByUser(username)
    deleteUser(username)
    const users = getFollowingList()
    res.json({ followingList: users })
  } catch (error) {
    console.error('[following] 删除失败:', error.message)
    res.status(500).json({ error: 'Failed to remove following' })
  }
})

// 导入单个用户：获取用户信息和媒体帖子并保存到DB
app.post('/api/following/import-user', async (req, res) => {
  try {
    const { username } = req.body
    if (!username) return res.status(400).json({ error: '需要提供用户名' })

    console.log(`[import-user] 开始导入 @${username}`)

    // 获取用户信息
    let userInfo = { username, name: username, avatar: '', bio: '', followers: '0' }
    try {
      const userResp = await fetchWithRetry(`${NITTER_URL}/${username}`)
      const $ = cheerio.load(userResp.data)
      userInfo = parseUserPage($, username)
    } catch (err) {
      console.error(`[import-user] 获取 @${username} 信息失败: ${err.message}`)
    }

    // 保存用户信息到DB
    upsertUser({
      ...userInfo,
      media_count: '0'
    })
    upsertUsernameMapBatch([{ username, name: userInfo.name }])

    // 获取用户媒体
    let mediaItems = []
    try {
      const mediaResp = await fetchWithRetry(`${NITTER_URL}/${username}/media`)
      const $ = cheerio.load(mediaResp.data)
      const parsed = parseMediaPage($, username)
      mediaItems = parsed.media
      if (mediaItems.length > 0) {
        upsertPosts(mediaItems)
      }
      console.log(`[import-user] @${username} → ${mediaItems.length} 条媒体`)
    } catch (err) {
      console.error(`[import-user] 获取 @${username} 媒体失败: ${err.message}`)
    }

    // 更新media_count
    const count = getPostsCountByUser(username)
    upsertUser({ ...userInfo, media_count: String(count) })

    // 返回用户信息和媒体
    const dbUser = getUser(username)
    const parseDate = (s) => {
      if (!s || typeof s !== 'string') return new Date(0)
      return new Date(s.replace(/·/g, ''))
    }
    const latestPost = mediaItems.length > 0
      ? mediaItems.reduce((a, b) => parseDate(a.date) > parseDate(b.date) ? a : b)
      : null

    const userResult = dbUser
      ? {
          ...dbRowToUser(dbUser),
          mediaCount: count,
          latestTweetDate: latestPost?.date || null
        }
      : {
          username,
          name: userInfo.name,
          avatar: userInfo.avatar,
          bio: userInfo.bio,
          mediaCount: count,
          latestTweetDate: latestPost?.date || null
        }

    res.json({ userInfo: userResult, media: mediaItems })
  } catch (error) {
    console.error('[import-user] Error:', error.message)
    res.status(500).json({ error: 'Failed to import user' })
  }
})

// 批量查询用户昵称
app.post('/api/usernames/resolve', (req, res) => {
  try {
    const { usernames } = req.body
    if (!usernames?.length) return res.json({})
    const result = resolveUsernames(usernames)
    res.json(result)
  } catch (error) {
    console.error('[usernames] Error:', error.message)
    res.status(500).json({})
  }
})

// 获取用户信息
app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params
    const response = await axios.get(`${NITTER_URL}/${username}`, { timeout: 10000 })
    const $ = cheerio.load(response.data)
    
    const avatarSrc = stripImageParams($('.profile-card-avatar img').attr('src') || '')
    
    const name = $('.profile-card-fullname').text().trim() || username
    upsertUsernameMapBatch([{ username, name }])
    
    res.json({
      username,
      name,
      avatar: avatarSrc.startsWith('http') ? avatarSrc : (avatarSrc ? `${NITTER_URL}${avatarSrc}` : ''),
      bio: $('.profile-bio').text().trim(),
      followers: $('.profile-statlist .followers .profile-stat-num').text().trim(),
    })
  } catch (error) {
    console.error('[user] Error:', error.message)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// 获取用户媒体
app.get('/api/user/:username/media', async (req, res) => {
  try {
    const { username } = req.params
    const cursor = req.query.cursor || ''
    const url = cursor ? `${NITTER_URL}${cursor}` : `${NITTER_URL}/${username}/media`
    
    const response = await axios.get(url, { timeout: 15000 })
    const $ = cheerio.load(response.data)
    const mediaItems = []
    
    $('.timeline-item').each((index, element) => {
      const $item = $(element)
      const tweetLink = $item.find('.tweet-link').attr('href')
      const tweetId = tweetLink ? tweetLink.split('/').pop().split('#')[0] : null
      const tweetText = $item.find('.tweet-content').text().trim()
      const tweetDate = $item.find('.tweet-date a').attr('title') || ''
      
      const likes = $item.find('.icon-heart').parent().text().trim()
      const retweets = $item.find('.icon-retweet').parent().text().trim()
      const replies = $item.find('.icon-comment').parent().text().trim()
      const views = $item.find('.icon-views').parent().text().trim()
      
      $item.find('.attachments .attachment').each((i, mediaEl) => {
        const $media = $(mediaEl)
        const $parent = $media.parent()
        
        let mediaUrl = ''
        let previewUrl = ''
        let type = 'photo'
        let duration = ''
        
        if ($parent.hasClass('gallery-video') || $parent.hasClass('gallery-gif')) {
          type = 'video'
          const videoEl = $media.find('video')
          const dataUrl = videoEl.attr('data-url') || ''
          
          if (dataUrl) {
            mediaUrl = dataUrl
          }
          
          let poster = videoEl.attr('poster') || ''
          previewUrl = stripImageParams(poster)
          
          duration = $parent.find('.overlay-duration').text().trim()
        } else {
          let imgSrc = $media.find('a img').attr('src') || $media.find('img').attr('src') || ''
          mediaUrl = stripImageParams(imgSrc)
          previewUrl = mediaUrl
        }
        
        if (mediaUrl) {
          mediaItems.push({
            id: `${tweetId}-${i}`,
            tweetId,
            tweetUrl: tweetLink ? `${NITTER_URL}${tweetLink}` : '',
            type,
            url: mediaUrl,
            previewUrl,
            text: tweetText,
            date: tweetDate,
            likes,
            retweets,
            replies,
            views,
            duration,
            author: username,
          })
        }
      })
    })
    
    const nextCursor = $('.show-more a').attr('href') || null
    
    res.json({
      media: mediaItems,
      nextCursor,
    })
  } catch (error) {
    console.error('[media] Error:', error.message)
    res.status(500).json({ error: 'Failed to fetch media' })
  }
})

// 获取推文详情和回复（自动加载more replies）
app.get('/api/tweet/:username/status/:tweetId', async (req, res) => {
  try {
    const { username, tweetId } = req.params
    const url = `${NITTER_URL}/${username}/status/${tweetId}`
    
    const response = await axios.get(url, { timeout: 15000 })
    const $ = cheerio.load(response.data)
    
    const replyThreads = []
    
    // 获取replies区域
    const $replies = $('.replies')
    
    // 收集所有需要加载的more replies URL
    const moreRepliesUrls = []
    
    // 遍历每个.reply容器（每个容器是一个回复线程）
    $replies.find('.reply').each((threadIndex, threadElement) => {
      const $thread = $(threadElement)
      const hasThreadLine = $thread.hasClass('thread-line')
      
      const threadItems = []
      
      // 遍历该线程内的所有timeline-item
      let previousUsername = null // 追踪前一个评论者的用户名
      $thread.find('.timeline-item').each((itemIndex, itemElement) => {
        const $item = $(itemElement)
        
        // 处理more-replies - 收集URL用于后续加载
        if ($item.hasClass('more-replies')) {
          const moreLink = $item.find('a').attr('href')
          if (moreLink) {
            const fullUrl = moreLink.startsWith('http') ? moreLink : `${NITTER_URL}${moreLink}`
            moreRepliesUrls.push({ url: fullUrl, threadIndex })
          }
          return
        }
        
        const replyUsername = $item.attr('data-username') || ''
        const replyName = $item.find('.fullname').text().trim()
        const replyText = $item.find('.tweet-content').text().trim()
        const replyAvatar = $item.find('.tweet-avatar img').attr('src') || ''
        const replyId = $item.find('.tweet-link').attr('href')?.split('/').pop()?.split('#')[0] || `${threadIndex}-${itemIndex}`
        const replyDate = $item.find('.tweet-date a').attr('title') || ''
        const replyDateShort = $item.find('.tweet-date a').text().trim()
        
        // 解析replying-to
        const replyingToUsers = []
        $item.find('.replying-to a').each((i, el) => {
          const user = $(el).text().trim().replace('@', '')
          if (user) replyingToUsers.push(user)
        })
        
        // 在线程内的所有评论都是嵌套回复
        // 有replying-to的：使用replying-to的第一个用户（直接回复的对象）
        // 没有replying-to的：回复前一个评论者
        let finalReplyingTo = []
        const isNestedReply = hasThreadLine // 只有thread容器内的回复才嵌套缩进
        
        if (isNestedReply) {
          // 线程内：处理replying-to关系
          if (replyingToUsers.length > 0) {
            // 只保留第一个用户（直接回复的对象），后面的只是@提及
            finalReplyingTo = [replyingToUsers[0]]
          } else if (previousUsername) {
            // 没有replying-to：回复前一个评论者
            finalReplyingTo = [previousUsername]
          }
        } else {
          // 非线程回复（直接回复主推文）：保留原始replyingTo
          finalReplyingTo = replyingToUsers
        }
        
        // 记录当前用户名，供下一个评论使用
        previousUsername = replyUsername
        
        // 解析互动数据
        const stats = {}
        $item.find('.tweet-stat').each((i, el) => {
          const $stat = $(el)
          const text = $stat.text().trim()
          if ($stat.find('.icon-comment').length) stats.replies = text || '0'
          else if ($stat.find('.icon-retweet').length) stats.retweets = text || '0'
          else if ($stat.find('.icon-heart').length) stats.likes = text || '0'
          else if ($stat.find('.icon-views').length) stats.views = text || '0'
        })
        
        // 判断在组内的位置
        const isThreadLast = $item.hasClass('thread-last')
        const isFirstItem = itemIndex === 0
        
        if (replyText) {
          threadItems.push({
            id: replyId,
            username: replyUsername,
            name: replyName,
            text: replyText,
            avatar: replyAvatar.startsWith('http') ? replyAvatar : (replyAvatar ? `${NITTER_URL}${replyAvatar}` : ''),
            date: replyDate,
            dateShort: replyDateShort,
            replyingTo: finalReplyingTo,
            isNestedReply,
            isFirstItem,
            isThreadLast,
            ...stats
          })
        }
      })
      
      if (threadItems.length > 0) {
        const firstItem = threadItems[0]
        const isNestedThread = firstItem.isNestedReply || (firstItem.replyingTo?.length > 0 && !firstItem.replyingTo.includes(username))
        
        replyThreads.push({
          items: threadItems,
          hasThreadLine,
          hasMoreReplies: false,
          isNestedThread
        })
      }
    })
    
    // 自动加载more replies页面
    for (const { url: moreUrl, threadIndex } of moreRepliesUrls) {
      try {
        const moreResponse = await axios.get(moreUrl, { timeout: 10000 })
        const $$ = cheerio.load(moreResponse.data)
        
        // 从more replies页面提取回复，添加到对应线程
        const targetThread = replyThreads[threadIndex]
        if (targetThread) {
          let allItems = []
          
          // 只提取replies区域的评论（这些是对评论的回复，都应该缩进）
          $$('#r .timeline-item:not(.more-replies)').each((idx, el) => {
            allItems.push($$(el))
          })
          
          if (allItems.length === 0) {
            $$('.timeline-item:not(.more-replies)').each((idx, el) => {
              const $el = $$(el)
              // 跳过before-tweet和main-tweet区域的
              if ($el.closest('.before-tweet').length || $el.closest('.main-tweet').length) {
                return
              }
              allItems.push($el)
            })
          }
          
          // more replies中的所有评论都应该缩进（因为它们都是对评论的回复）
          const isNestedReplyForMore = true
          
          allItems.forEach(($item, idx) => {
            const replyUsername = $item.attr('data-username') || ''
            const replyName = $item.find('.fullname').text().trim()
            const replyText = $item.find('.tweet-content').text().trim()
            const replyAvatar = $item.find('.tweet-avatar img').attr('src') || ''
            const replyId = $item.find('.tweet-link').attr('href')?.split('/').pop()?.split('#')[0] || `more-${idx}`
            const replyDate = $item.find('.tweet-date a').attr('title') || ''
            const replyDateShort = $item.find('.tweet-date a').text().trim()
            
            const replyingToUsers = []
            $item.find('.replying-to a').each((i, elem) => {
              const user = $$(elem).text().trim().replace('@', '')
              if (user) replyingToUsers.push(user)
            })
            
            const stats = {}
            $item.find('.tweet-stat').each((i, el) => {
              const $stat = $$(el)
              const text = $stat.text().trim()
              if ($stat.find('.icon-comment').length) stats.replies = text || '0'
              else if ($stat.find('.icon-retweet').length) stats.retweets = text || '0'
              else if ($stat.find('.icon-heart').length) stats.likes = text || '0'
              else if ($stat.find('.icon-views').length) stats.views = text || '0'
            })
            
            if (replyText && replyUsername) {
              targetThread.items.push({
                id: replyId,
                username: replyUsername,
                name: replyName,
                text: replyText,
                avatar: replyAvatar.startsWith('http') ? replyAvatar : (replyAvatar ? `${NITTER_URL}${replyAvatar}` : ''),
                date: replyDate,
                dateShort: replyDateShort,
                replyingTo: replyingToUsers,
                isNestedReply: isNestedReplyForMore,
                isFirstItem: false,
                isThreadLast: idx === allItems.length - 1,
                ...stats
              })
            }
          })
          
          // 检查是否还有更多replies
          const nextMore = $$('.more-replies a').attr('href')
          if (nextMore) {
            targetThread.hasMoreReplies = true
            targetThread.nextMoreUrl = nextMore.startsWith('http') ? nextMore : `${NITTER_URL}${nextMore}`
          }
        }
      } catch (err) {
        console.error(`Failed to load more replies from ${moreUrl}:`, err.message)
      }
    }
    
    // 收集评论中的用户名映射
    const nameMap = []
    for (const thread of replyThreads) {
      for (const item of thread.items) {
        if (item.username && item.name) {
          nameMap.push({ username: item.username, name: item.name })
        }
      }
    }
    if (nameMap.length > 0) upsertUsernameMapBatch(nameMap)
    
    res.json({
      replyThreads
    })
  } catch (error) {
    console.error('[tweet] Error:', error.message)
    res.status(500).json({
      error: 'Failed to fetch tweet',
      replyThreads: []
    })
  }
})

// 批量导入关注列表（使用cookie认证）
app.post('/api/import-following', async (req, res) => {
  try {
    const { username, cookie } = req.body
    
    if (!username) {
      return res.status(400).json({ error: '需要提供用户名' })
    }
    
    const followingList = []
    let cursor = ''
    let hasMore = true
    let pageCount = 0
    const maxPages = 10
    
    while (hasMore && pageCount < maxPages && followingList.length < 500) {
      const url = cursor ? `${NITTER_URL}${cursor}` : `${NITTER_URL}/${username}/following`
      
      try {
        const headers = {}
        if (cookie) {
          headers.Cookie = cookie
        }
        
        const response = await axios.get(url, { 
          timeout: 10000,
          headers
        })
        const $ = cheerio.load(response.data)
        
        // 检查是否需要登录
        if ($('.error-panel').length || $('body').text().includes('Log in')) {
          if (followingList.length === 0) {
            return res.status(403).json({ 
              error: '需要登录才能查看关注列表。请提供有效的cookie。',
              needAuth: true
            })
          }
          hasMore = false
          break
        }
        
        $('.profile-card').each((index, element) => {
          const $card = $(element)
          const userUsername = $card.find('.username').text().trim().replace('@', '')
          const userName = $card.find('.fullname').text().trim()
          const userAvatar = $card.find('.avatar').attr('src') || ''
          
          if (userUsername && !followingList.find(u => u.username === userUsername)) {
            followingList.push({
              username: userUsername,
              name: userName || userUsername,
              avatar: userAvatar.startsWith('http') ? userAvatar : (userAvatar ? `${NITTER_URL}${userAvatar}` : '')
            })
          }
        })
        
        const nextCursor = $('.show-more a').attr('href')
        if (nextCursor) {
          cursor = nextCursor
          pageCount++
        } else {
          hasMore = false
        }
        
      } catch (err) {
        console.error(`Error fetching following page:`, err.message)
        if (err.response?.status === 403 || err.response?.status === 401) {
          if (followingList.length === 0) {
            return res.status(403).json({ 
              error: '需要登录才能查看关注列表。请提供有效的cookie。',
              needAuth: true
            })
          }
        }
        hasMore = false
      }
    }
    
    res.json({
      success: true,
      count: followingList.length,
      users: followingList
    })
    
    if (followingList.length > 0) {
      const usernames = followingList.map(u => u.username)
      addFollowingBatch(usernames)
      upsertUsernameMapBatch(followingList.map(u => ({ username: u.username, name: u.name })))
    }
    
  } catch (error) {
    console.error('[import] Error:', error.message)
    res.status(500).json({ error: `导入失败: ${error.message}` })
  }
})

app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production' && existsSync(join(DIST_PATH, 'index.html'))) {
    res.sendFile(join(DIST_PATH, 'index.html'))
  }
})

app.listen(PORT, async () => {
  await initDB()
  const following = getFollowingList()
  cleanupNonFollowing(following)
  console.log(`Backend running on http://localhost:${PORT}`)
  console.log(`Nitter URL: ${NITTER_URL}`)

  const refreshInterval = parseInt(process.env.AUTO_REFRESH_INTERVAL, 10)
  if (refreshInterval > 0) {
    const intervalMin = (refreshInterval / 60000).toFixed(0)
    console.log(`[auto-refresh] 已启用，间隔 ${intervalMin} 分钟`)
    setTimeout(() => {
      autoRefreshAll()
      setInterval(autoRefreshAll, refreshInterval)
    }, 60000)
  }
})

// ========== 辅助函数：解析nitter媒体页面 ==========
function parseMediaPage($, username) {
  const mediaItems = []
  
  $('.timeline-item').each((index, element) => {
    const $item = $(element)
    const tweetLink = $item.find('.tweet-link').attr('href')
    const tweetId = tweetLink ? tweetLink.split('/').pop().split('#')[0] : null
    const tweetText = $item.find('.tweet-content').text().trim()
    const tweetDate = $item.find('.tweet-date a').attr('title') || ''
    
    const likes = $item.find('.icon-heart').parent().text().trim()
    const retweets = $item.find('.icon-retweet').parent().text().trim()
    const replies = $item.find('.icon-comment').parent().text().trim()
    const views = $item.find('.icon-views').parent().text().trim()
    
    $item.find('.attachments .attachment').each((i, mediaEl) => {
      const $media = $(mediaEl)
      const $parent = $media.parent()
      
      let mediaUrl = ''
      let previewUrl = ''
      let type = 'photo'
      let duration = ''
      
      if ($parent.hasClass('gallery-video') || $parent.hasClass('gallery-gif')) {
        type = 'video'
        const videoEl = $media.find('video')
        const dataUrl = videoEl.attr('data-url') || ''
        if (dataUrl) mediaUrl = dataUrl
        previewUrl = stripImageParams(videoEl.attr('poster') || '')
        duration = $parent.find('.overlay-duration').text().trim()
      } else {
          mediaUrl = stripImageParams($media.find('a img').attr('src') || $media.find('img').attr('src') || '')
          previewUrl = mediaUrl
        }
        
        if (mediaUrl) {
          mediaItems.push({
            id: `${tweetId}-${i}`,
            tweetId,
            tweetUrl: tweetLink ? `${NITTER_URL}${tweetLink}` : '',
            type,
            url: mediaUrl,
            previewUrl: stripImageParams(previewUrl),
          text: tweetText,
          date: tweetDate,
          likes,
          retweets,
          replies,
          views,
          duration,
          author: username,
        })
      }
    })
  })
  
  const nextCursor = $('.show-more a').attr('href') || null
  
  return { media: mediaItems, nextCursor }
}

// ========== 辅助函数：解析nitter用户页面 ==========
function parseUserPage($, username) {
  const avatarSrc = stripImageParams($('.profile-card-avatar img').attr('src') || '')
  
  return {
    username,
    name: $('.profile-card-fullname').text().trim() || username,
    avatar: avatarSrc.startsWith('http') ? avatarSrc : (avatarSrc ? `${NITTER_URL}${avatarSrc}` : ''),
    bio: $('.profile-bio').text().trim(),
    followers: $('.profile-statlist .followers .profile-stat-num').text().trim(),
  }
}

// ========== 媒体页面批量获取 ==========

// 并行批量获取（带速率限制+重试）
const CONCURRENCY = 3
const REQUEST_DELAY = 300
const MAX_RETRIES = 3
const delay = (ms) => new Promise(r => setTimeout(r, ms))

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await axios.get(url, { timeout: 10000 })
      return resp
    } catch (err) {
      const status = err.response?.status
      if (status === 429 && attempt < retries) {
        const waitMs = 2000 * Math.pow(2, attempt)
        console.log(`[retry] ${url} → 429, 等待 ${waitMs}ms 后重试 (${attempt + 1}/${retries})`)
        await delay(waitMs)
        continue
      }
      throw err
    }
  }
}

const fetchAllMedia = async (usernames) => {
  const results = new Array(usernames.length)
  let index = 0

  const worker = async () => {
    while (index < usernames.length) {
      const i = index++
      const u = usernames[i]
      try {
        const resp = await fetchWithRetry(`${NITTER_URL}/${u}/media`)
        const $ = cheerio.load(resp.data)
        const parsed = parseMediaPage($, u)
        results[i] = { username: u, items: parsed.media }
        console.log(`[media] ${u} → ${parsed.media.length} 条`)
      } catch (err) {
        console.error(`[media] ${u} 失败: ${err.message}`)
        results[i] = { username: u, items: [], error: err.message }
      }
      await delay(REQUEST_DELAY)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  return results
}

// 并行批量获取用户信息
const fetchAllUserInfo = async (usernames) => {
  const results = new Array(usernames.length)
  let index = 0

  const worker = async () => {
    while (index < usernames.length) {
      const i = index++
      const u = usernames[i]
      try {
        const resp = await fetchWithRetry(`${NITTER_URL}/${u}`)
        const $ = cheerio.load(resp.data)
        results[i] = parseUserPage($, u)
        console.log(`[user] ${u} OK`)
      } catch (err) {
        console.error(`[user] ${u} 失败: ${err.message}`)
        results[i] = { username: u, name: u, avatar: '', bio: '', media_count: '0', followers: '0' }
      }
      await delay(REQUEST_DELAY)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  return results
}

// 普通加载：从数据库读取，不请求nitter
app.post('/api/feed/batch', async (req, res) => {
  try {
    const { usernames } = req.body
    if (!usernames?.length) return res.json({ media: [], usersInfo: [], hasMore: false })

    const startTime = Date.now()
    const allMedia = getPostsByUsernames(usernames)
    const usersInfo = getUsersByUsernames(usernames)

    const parseDate = (s) => {
      if (!s || typeof s !== 'string') return new Date(0)
      return new Date(s.replace(/·/g, ''))
    }
    const dateMap = {}
    for (const m of allMedia) {
      if (!dateMap[m.author] || parseDate(m.date) > parseDate(dateMap[m.author])) {
        dateMap[m.author] = m.date
      }
    }
    const sortedUsers = usersInfo
      .map(u => ({
        ...u,
        mediaCount: parseInt(u.media_count) || 0,
        latestTweetDate: dateMap[u.username] || null
      }))
      .sort((a, b) => parseDate(b.latestTweetDate || 0) - parseDate(a.latestTweetDate || 0))

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[feed] 从DB读取 ${usernames.length} 个用户，${allMedia.length} 条帖子，耗时 ${elapsed}s`)

    res.json({ media: allMedia, usersInfo: sortedUsers, hasMore: false, totalMerged: allMedia.length })
  } catch (error) {
    console.error('[feed] Error:', error.message)
    res.status(500).json({ error: 'Failed to fetch feed' })
  }
})

// 智能刷新：SSE流式推送进度
app.post('/api/feed/refresh', async (req, res) => {
  try {
    const { usernames } = req.body
    if (!usernames?.length) {
      return res.json({ media: [], usersInfo: [], hasMore: false, updated: 0 })
    }

    // 设置SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const sendEvent = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    const startTime = Date.now()
    const total = usernames.length
    sendEvent({ type: 'progress', current: 0, total, message: `开始刷新 ${total} 个用户` })

    // 第一步：读取DB中的旧用户信息
    const oldUsers = {}
    for (const u of usernames) {
      const cached = getUser(u)
      if (cached) oldUsers[u] = cached
    }

    // 第二步：逐个获取用户最新信息，推送进度
    const userResults = []
    let fetchedCount = 0
    for (const u of usernames) {
      try {
        const resp = await fetchWithRetry(`${NITTER_URL}/${u}`)
        const $ = cheerio.load(resp.data)
        const info = parseUserPage($, u)
        userResults.push(info)
      } catch (err) {
        console.error(`[user] ${u} 失败: ${err.message}`)
        userResults.push({ username: u, name: u, avatar: '', bio: '', media_count: '0', followers: '0' })
      }
      fetchedCount++
      sendEvent({ type: 'progress', current: fetchedCount, total, message: `获取用户信息 ${fetchedCount}/${total}` })
      await delay(REQUEST_DELAY)
    }

    // 第三步：比较媒体数，找出需要更新的用户
    const needUpdateUsers = []
    for (const freshUser of userResults) {
      const cachedUser = oldUsers[freshUser.username]
      if (!cachedUser) {
        needUpdateUsers.push(freshUser.username)
        console.log(`[refresh] ${freshUser.username}: 新用户，需获取媒体`)
      } else {
        const dbMediaCount = getPostsCountByUser(freshUser.username)
        const recordedMediaCount = parseInt(String(cachedUser.media_count).replace(/,/g, '') || '0')
        const noAvatar = !cachedUser.avatar
        console.log(`[refresh] ${freshUser.username}: DB实际${dbMediaCount}条, 记录${recordedMediaCount}条${noAvatar ? ', 无头像' : ''}`)
        if (dbMediaCount === 0) {
          needUpdateUsers.push(freshUser.username)
          console.log(`[refresh] ${freshUser.username}: DB中0条帖子，需获取媒体`)
        } else if (dbMediaCount !== recordedMediaCount) {
          needUpdateUsers.push(freshUser.username)
          console.log(`[refresh] ${freshUser.username}: DB实际${dbMediaCount}条 vs 记录${recordedMediaCount}条，需更新`)
        } else if (noAvatar) {
          needUpdateUsers.push(freshUser.username)
          console.log(`[refresh] ${freshUser.username}: 无头像，需重新导入`)
        }
      }
    }

    // 第四步：写入用户信息到DB
    const usersForDb = userResults.map(u => ({
      ...u,
      media_count: u.media_count || '0'
    }))
    upsertUsers(usersForDb)
    upsertUsernameMapBatch(userResults.map(u => ({ username: u.username, name: u.name })))

    // 第五步：逐个获取有更新用户的媒体，推送进度
    let newPostsCount = 0
    let mediaFetchedCount = 0
    const mediaTotal = needUpdateUsers.length
    if (needUpdateUsers.length > 0) {
      sendEvent({ type: 'progress', current: 0, total: mediaTotal, message: `获取媒体 0/${mediaTotal}` })
      for (const u of needUpdateUsers) {
        try {
          const resp = await fetchWithRetry(`${NITTER_URL}/${u}/media`)
          const $ = cheerio.load(resp.data)
          const parsed = parseMediaPage($, u)
          if (parsed.media.length > 0) {
            upsertPosts(parsed.media)
            newPostsCount += parsed.media.length
          }
          const count = getPostsCountByUser(u)
          const user = getUser(u)
          if (user) {
            upsertUser({ ...dbRowToUser(user), media_count: String(count) })
          }
        } catch (err) {
          console.error(`[media] ${u} 失败: ${err.message}`)
        }
        mediaFetchedCount++
        sendEvent({ type: 'progress', current: mediaFetchedCount, total: mediaTotal, message: `获取媒体 ${mediaFetchedCount}/${mediaTotal}` })
        await delay(REQUEST_DELAY)
      }
    }

    // 第六步：从DB返回完整数据
    const allMedia = getPostsByUsernames(usernames)
    const usersInfo = getUsersByUsernames(usernames)

    const parseDate2 = (s) => {
      if (!s || typeof s !== 'string') return new Date(0)
      return new Date(s.replace(/·/g, ''))
    }
    const dateMap = {}
    for (const m of allMedia) {
      if (!dateMap[m.author] || parseDate2(m.date) > parseDate2(dateMap[m.author])) {
        dateMap[m.author] = m.date
      }
    }
    const sortedUsers = usersInfo
      .map(u => ({
        ...u,
        mediaCount: parseInt(u.media_count) || 0,
        latestTweetDate: dateMap[u.username] || null
      }))
      .sort((a, b) => parseDate2(b.latestTweetDate || 0) - parseDate2(a.latestTweetDate || 0))

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[refresh] 完成，耗时 ${elapsed}s，更新 ${needUpdateUsers.length}/${usernames.length} 个用户，新增 ${newPostsCount} 条帖子`)

    sendEvent({
      type: 'done',
      data: {
        media: allMedia,
        usersInfo: sortedUsers,
        hasMore: false,
        totalMerged: allMedia.length,
        updated: needUpdateUsers.length,
        newPosts: newPostsCount
      }
    })
    res.end()
  } catch (error) {
    console.error('[refresh] Error:', error.message)
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
    res.end()
  }
})

async function autoRefreshAll() {
  const following = getFollowingList()
  if (!following.length) {
    console.log('[auto-refresh] 关注列表为空，跳过')
    return
  }

  const startTime = Date.now()
  console.log(`[auto-refresh] 开始刷新 ${following.length} 个用户`)

  let updatedCount = 0
  let newPostsCount = 0

  for (const username of following) {
    try {
      const resp = await fetchWithRetry(`${NITTER_URL}/${username}`)
      const $ = cheerio.load(resp.data)
      const info = parseUserPage($, username)

      const cachedUser = getUser(username)
      const dbMediaCount = getPostsCountByUser(username)
      const recordedMediaCount = parseInt(String(cachedUser?.media_count).replace(/,/g, '') || '0')

      upsertUser({ ...info, media_count: info.media_count || '0' })
      upsertUsernameMapBatch([{ username, name: info.name }])

      if (dbMediaCount === 0 || dbMediaCount !== recordedMediaCount || !cachedUser?.avatar) {
        try {
          const mediaResp = await fetchWithRetry(`${NITTER_URL}/${username}/media`)
          const $$ = cheerio.load(mediaResp.data)
          const parsed = parseMediaPage($$, username)
          if (parsed.media.length > 0) {
            upsertPosts(parsed.media)
            newPostsCount += parsed.media.length
          }
          const count = getPostsCountByUser(username)
          const user = getUser(username)
          if (user) {
            upsertUser({ ...dbRowToUser(user), media_count: String(count) })
          }
          updatedCount++
        } catch (err) {
          console.error(`[auto-refresh] ${username} 媒体获取失败: ${err.message}`)
        }
      }

      await delay(REQUEST_DELAY)
    } catch (err) {
      console.error(`[auto-refresh] ${username} 失败: ${err.message}`)
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[auto-refresh] 完成，耗时 ${elapsed}s，更新 ${updatedCount}/${following.length} 个用户，新增 ${newPostsCount} 条帖子`)
}
