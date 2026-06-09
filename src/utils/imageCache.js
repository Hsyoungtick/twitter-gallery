// 图片缓存工具
// 使用 Cache API 缓存图片，限制最大条目数避免无限膨胀

const CACHE_NAME = 'twitter-gallery-images'
const MAX_ENTRIES = 500 // 最大缓存条目数

// 获取缓存实例
async function getCache() {
  return await caches.open(CACHE_NAME)
}

// 缓存图片
export async function cacheImage(url) {
  if (!url || url.startsWith('data:')) return
  try {
    const cache = await getCache()
    const response = await cache.match(url)
    if (response) return // 已缓存，跳过

    const fetchResponse = await fetch(url)
    if (!fetchResponse.ok) return

    await cache.put(url, fetchResponse.clone())
    // 缓存后检查是否超限
    await trimCache()
  } catch {
    // 缓存失败不影响正常使用
  }
}

// 从缓存获取图片
export async function getCachedImage(url) {
  if (!url || url.startsWith('data:')) return null
  try {
    const cache = await getCache()
    const response = await cache.match(url)
    return response || null
  } catch {
    return null
  }
}

// 清理超出限制的缓存（LRU策略：按缓存时间删除最早的）
async function trimCache() {
  try {
    const cache = await getCache()
    const keys = await cache.keys()
    if (keys.length <= MAX_ENTRIES) return

    // 删除最早的缓存条目
    const deleteCount = keys.length - MAX_ENTRIES
    for (let i = 0; i < deleteCount; i++) {
      await cache.delete(keys[i])
    }
  } catch {
    // 清理失败不影响正常使用
  }
}

// 获取缓存使用情况
export async function getCacheStats() {
  try {
    const cache = await getCache()
    const keys = await cache.keys()
    return { count: keys.length, max: MAX_ENTRIES }
  } catch {
    return { count: 0, max: MAX_ENTRIES }
  }
}

// 清空所有缓存
export async function clearImageCache() {
  try {
    await caches.delete(CACHE_NAME)
  } catch {
    // 忽略错误
  }
}
