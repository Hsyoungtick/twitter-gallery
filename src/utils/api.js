import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

export const nitterApi = {
  async getUser(username) {
    const response = await axios.get(`${API_BASE}/user/${username}`)
    return response.data
  },

  async getUserMedia(username, cursor = null) {
    const params = {}
    if (cursor) {
      params.cursor = cursor
    }
    const response = await axios.get(`${API_BASE}/user/${username}/media`, { params })
    return response.data
  },

  async getFeedBatch(usernames) {
    const response = await axios.post(`${API_BASE}/feed/batch`, {
      usernames
    })
    return response.data
  },

  async refreshFeed(usernames, onProgress) {
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
    const response = await axios.post(`${API_BASE}/usernames/resolve`, {
      usernames
    })
    return response.data
  },

  async getFollowing() {
    const response = await axios.get(`${API_BASE}/following`)
    return response.data
  },

  async addFollowing(username) {
    const response = await axios.post(`${API_BASE}/following/add`, { username })
    return response.data
  },

  async addFollowingBatch(usernames) {
    const response = await axios.post(`${API_BASE}/following/add-batch`, { usernames })
    return response.data
  },

  async importUser(username) {
    const response = await axios.post(`${API_BASE}/following/import-user`, { username })
    return response.data
  },

  async removeFollowing(username) {
    const response = await axios.post(`${API_BASE}/following/remove`, { username })
    return response.data
  },

  async getTweetReplies(author, tweetId) {
    const response = await axios.get(`${API_BASE}/tweet/${author}/status/${tweetId}`)
    return response.data
  }
}

export default nitterApi
