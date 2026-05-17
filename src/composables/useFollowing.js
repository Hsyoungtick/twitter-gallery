import { ref } from 'vue'
import nitterApi from '../utils/api'

export function useFollowing() {
  const followingList = ref([])
  const loading = ref(false)

  const loadFollowing = async () => {
    loading.value = true
    try {
      const result = await nitterApi.getFollowing()
      followingList.value = result.followingList.map(username => ({
        username,
        displayName: username,
        avatar: null
      }))
    } catch (err) {
      console.error('[following] 加载失败:', err)
    } finally {
      loading.value = false
    }
  }

  const addFollowing = async (username) => {
    if (followingList.value.some(u => u.username === username)) return
    try {
      const result = await nitterApi.addFollowing(username)
      followingList.value = result.followingList.map(u => {
        const existing = followingList.value.find(f => f.username === u)
        return existing || { username: u, displayName: u, avatar: null }
      })
    } catch (err) {
      console.error('[following] 添加失败:', err)
    }
  }

  const addFollowingBatch = async (usernames) => {
    const newNames = usernames.filter(u => !followingList.value.some(f => f.username === u))
    if (!newNames.length) return
    try {
      const result = await nitterApi.addFollowingBatch(newNames)
      followingList.value = result.followingList.map(u => {
        const existing = followingList.value.find(f => f.username === u)
        return existing || { username: u, displayName: u, avatar: null }
      })
    } catch (err) {
      console.error('[following] 批量添加失败:', err)
    }
  }

  const removeFollowing = async (username) => {
    try {
      const result = await nitterApi.removeFollowing(username)
      followingList.value = result.followingList.map(u => {
        const existing = followingList.value.find(f => f.username === u)
        return existing || { username: u, displayName: u, avatar: null }
      })
    } catch (err) {
      console.error('[following] 删除失败:', err)
    }
  }

  const updateFollowing = (username, data) => {
    const user = followingList.value.find(u => u.username === username)
    if (user) {
      Object.assign(user, data)
    }
  }

  loadFollowing()

  return {
    followingList,
    addFollowing,
    addFollowingBatch,
    removeFollowing,
    updateFollowing,
    loadFollowing,
    loading
  }
}
