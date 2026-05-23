import axios from 'axios'

const API_BASE = '/api'

let demoData = null
let demoMode = import.meta.env.VITE_DEMO === 'true'

async function loadDemoData() {
  if (demoData) return demoData
  try {
    const base = import.meta.env.BASE_URL || '/'
    const resp = await fetch(`${base}demo-data.json`)
    demoData = await resp.json()
    console.log('[demo] 静态数据加载完成')
    return demoData
  } catch (err) {
    console.error('[demo] 静态数据加载失败:', err)
    return null
  }
}

export function isDemoMode() {
  return demoMode
}

async function checkBackend() {
  if (demoMode) return false
  try {
    await axios.get(`${API_BASE}/following`, { timeout: 2000 })
    return true
  } catch {
    console.log('[demo] 后端不可用，切换到演示模式')
    demoMode = true
    return false
  }
}

export const nitterApi = {
  async getUser(username) {
    if (demoMode) {
      const data = await loadDemoData()
      return data?.usersInfo?.find(u => u.username === username) || { username, name: username }
    }
    const response = await axios.get(`${API_BASE}/user/${username}`)
    return response.data
  },

  async getUserMedia(username, cursor = null) {
    if (demoMode) {
      const data = await loadDemoData()
      return { media: data?.media?.filter(m => m.author === username) || [] }
    }
    const params = {}
    if (cursor) {
      params.cursor = cursor
    }
    const response = await axios.get(`${API_BASE}/user/${username}/media`, { params })
    return response.data
  },

  async getFeedBatch(usernames) {
    if (demoMode) {
      const data = await loadDemoData()
      return {
        media: data?.media || [],
        usersInfo: data?.usersInfo || [],
        hasMore: false
      }
    }
    const response = await axios.post(`${API_BASE}/feed/batch`, {
      usernames
    })
    return response.data
  },

  async refreshFeed(usernames, onProgress) {
    if (demoMode) {
      const data = await loadDemoData()
      if (onProgress) onProgress({ type: 'progress', current: 1, total: 1, message: '演示模式' })
      return {
        media: data?.media || [],
        usersInfo: data?.usersInfo || [],
        hasMore: false,
        updated: 0,
        newPosts: 0
      }
    }
    const API_BASE_URL = API_BASE.replace('/api', '')
    const response = await fetch(`${API_BASE_URL}/api/feed/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames })
    })

    if (!response.ok) {
      throw new Error(`刷新失败: ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'progress' && onProgress) {
              onProgress(event)
            } else if (event.type === 'done') {
              result = event.data
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e
          }
        }
      }
    }

    return result || { media: [], usersInfo: [], updated: 0, newPosts: 0 }
  },

  async resolveUsernames(usernames) {
    if (demoMode) {
      const data = await loadDemoData()
      const map = {}
      for (const u of (data?.usersInfo || [])) {
        if (usernames.includes(u.username)) map[u.username] = u.name
      }
      return map
    }
    const response = await axios.post(`${API_BASE}/usernames/resolve`, {
      usernames
    })
    return response.data
  },

  async getFollowing() {
    if (demoMode) {
      const data = await loadDemoData()
      return { followingList: data?.usersInfo?.map(u => u.username) || [] }
    }
    const response = await axios.get(`${API_BASE}/following`)
    return response.data
  },

  async addFollowing(username) {
    if (demoMode) return { followingList: [] }
    const response = await axios.post(`${API_BASE}/following/add`, { username })
    return response.data
  },

  async addFollowingBatch(usernames) {
    if (demoMode) return { followingList: [] }
    const response = await axios.post(`${API_BASE}/following/add-batch`, { usernames })
    return response.data
  },

  async importUser(username) {
    if (demoMode) return { userInfo: null, media: [] }
    const response = await axios.post(`${API_BASE}/following/import-user`, { username })
    return response.data
  },

  async removeFollowing(username) {
    if (demoMode) return { followingList: [] }
    const response = await axios.post(`${API_BASE}/following/remove`, { username })
    return response.data
  },

  async getTweetReplies(author, tweetId) {
    if (demoMode) {
      const data = await loadDemoData()
      return { replyThreads: data?.replies?.[tweetId] || [] }
    }
    const response = await axios.get(`${API_BASE}/tweet/${author}/status/${tweetId}`)
    return response.data
  },

  async checkBackendAndInit() {
    const available = await checkBackend()
    if (!available) {
      await loadDemoData()
    }
    return available
  }
}

export default nitterApi
