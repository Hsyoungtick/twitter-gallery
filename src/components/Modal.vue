<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      @click.self="$emit('close')"
      ref="modalOverlay"
    >
      <div class="relative w-full h-full flex">
        <a
          :href="xUrl"
          target="_blank"
          class="absolute top-4 right-16 z-10 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
          @click.stop
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <button
          class="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
          @click.stop="$emit('close')"
          :title="t('modal.close')"
        >
          <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        
        <div 
          class="flex-1 flex items-center justify-center p-2 min-w-0 overflow-hidden"
          @click.self="imgFullscreen ? (imgFullscreen = false) : $emit('close')"
          @mousemove="onImgMouseMove"
          @mouseup="onImgMouseUp"
          @mouseleave="onImgMouseUp"
        >
          <div class="w-[95%] h-[95vh] max-h-[95vh] flex items-center justify-center">
            <div v-if="media" class="w-full h-full flex items-center justify-center" @click.self="imgFullscreen ? (imgFullscreen = false) : $emit('close')">
              <img
                v-if="media.type === 'photo'"
                :src="media.url"
                :alt="media.text"
                ref="imgRef"
                class="max-w-full max-h-full object-contain rounded-lg cursor-zoom-in"
                :class="{ 'cursor-zoom-out': imgFullscreen && imgScale <= 1, 'cursor-grab': imgFullscreen && imgScale > 1 }"
                :style="imgStyle"
                @click.stop="toggleFullscreen"
                @wheel.prevent="onImgWheel"
                @mousedown.prevent="onImgMouseDown"
              />
              
              <div v-else class="relative w-full h-full flex items-center justify-center" @click.self="$emit('close')">
                <video
                  ref="videoRef"
                  :poster="media.previewUrl"
                  controls
                  class="max-w-full max-h-full rounded-lg video-player"
                  @error="onVideoError"
                  @click.stop
                ></video>
              
              <div 
                v-if="videoError" 
                class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg"
              >
                <div class="text-white text-center p-4">
                  <ExclamationTriangleIcon class="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                  <p class="text-lg mb-2">{{ t('modal.videoLoadFailed') }}</p>
                  <p class="text-sm opacity-70 mb-4">{{ videoErrorMsg }}</p>
                  <a 
                    :href="media.tweetUrl" 
                    target="_blank"
                    class="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    {{ t('modal.watchOnNitter') }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
        <div v-if="media && !imgFullscreen" class="w-[420px] bg-white dark:bg-zinc-900 flex flex-col h-full overflow-y-auto">
          <div v-if="authorInfo" class="tweet-header p-4 border-b dark:border-zinc-700">
            <div class="flex items-start">
              <a :href="`https://x.com/${authorInfo.username}`" target="_blank" class="tweet-avatar flex-shrink-0 mr-3 hover:opacity-80 transition-opacity">
                <img
                  v-if="authorInfo.avatar"
                  :src="authorInfo.avatar"
                  class="avatar round w-14 h-14"
                  alt=""
                />
              </a>
              <div class="flex-1 min-w-0">
                <div class="fullname-and-username">
                  <a 
                    :href="`https://x.com/${authorInfo.username}`" 
                    target="_blank"
                    class="fullname font-bold text-base text-gray-900 dark:text-gray-100 hover:underline block"
                  >{{ authorInfo.name }}</a>
                  <a 
                    :href="`https://x.com/${authorInfo.username}`" 
                    target="_blank"
                    class="username text-gray-500 dark:text-gray-400 text-sm hover:underline block mt-0.5"
                  >@{{ authorInfo.username }}</a>
                </div>
              </div>
            </div>
          </div>
          
          <div class="px-4 py-3">
            <div class="tweet-content media-body text-base whitespace-pre-wrap leading-relaxed" v-html="formatTweetContent(media.text)"></div>
            
            <div class="tweet-stats mt-3 pt-3 flex items-center gap-5 text-sm">
              <span class="text-gray-400 text-sm">
                <a 
                  :href="`https://x.com/${authorInfo.username}/status/${media.tweetId}`"
                  target="_blank"
                  class="hover:underline"
                  :title="media.date"
                >{{ formatDate(media.date) }}</a>
              </span>
              
              <span class="tweet-stat inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-default">
                <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
                {{ media.replies || '0' }}
              </span>
              <span class="tweet-stat inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors cursor-default">
                <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ media.retweets || '0' }}
              </span>
              <span class="tweet-stat inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-default">
                <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                {{ media.likes || '0' }}
              </span>
              <span class="tweet-stat inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-default">
                <svg class="h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                {{ media.views || '0' }}
              </span>
            </div>
          </div>
          
          <div class="flex-1 border-t dark:border-zinc-700 min-h-0 replies-container">
            <div v-if="loadingReplies" class="p-4 text-center">
              <div class="spinner mx-auto"></div>
            </div>
            
            <template v-else-if="replyThreads.length > 0">
              <div 
                v-for="(thread, threadIndex) in replyThreads" 
                :key="threadIndex"
                class="reply-thread"
              >
                <template v-for="(reply, itemIndex) in thread.items" :key="reply.id">
                  <div 
                    class="reply-item py-3 px-4 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors"
                    :class="{ 'ml-8': reply.isNestedReply && !reply.isFirstItem }"
                  >
                    <div class="flex items-start gap-3">
                      <a :href="`https://x.com/${reply.username}`" target="_blank" class="flex-shrink-0 hover:opacity-80 transition-opacity">
                        <img 
                          :src="reply.avatar" 
                          class="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700"
                          alt=""
                        />
                      </a>
                      
                      <div class="flex-1 min-w-0">
                        <div class="flex items-baseline gap-2 text-sm leading-relaxed">
                          <a 
                            :href="`https://x.com/${reply.username}`" 
                            target="_blank"
                            class="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex-shrink-0"
                          >{{ reply.name }}</a>
                          
                          <span v-if="reply.isNestedReply && reply.replyingTo?.length > 0 && !reply.isFirstItem" class="text-gray-500 dark:text-gray-400 flex-shrink-0 text-sm">
                            {{ t('modal.reply') }}
                            <a 
                              v-for="(user, i) in reply.replyingTo.slice(0, 1)" 
                              :key="user"
                              :href="`https://x.com/${user}`" 
                              target="_blank"
                              class="text-blue-500 hover:underline ml-1"
                            >{{ usernameCache[user] || `@${user}` }}</a>
                          </span>
                        </div>
                        
                        <div class="text-sm text-gray-900 dark:text-gray-100 break-words mt-0.5" v-html="formatTweetContent(reply.text)"></div>
                        
                        <div class="mt-1.5 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                          <span :title="reply.date">{{ formatReplyDate(reply.date) }}</span>
                          
                          <button class="inline-flex items-center gap-1 hover:text-blue-500 transition-colors cursor-default group" title="Comment">
                            <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                            </svg>
                            {{ reply.replies || '0' }}
                          </button>
                          
                          <button class="inline-flex items-center gap-1 hover:text-green-500 transition-colors cursor-default group" title="Retweet">
                            <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            {{ reply.retweets || '0' }}
                          </button>
                          
                          <button class="inline-flex items-center gap-1 hover:text-red-500 transition-colors cursor-default group" title="Like">
                            <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            {{ reply.likes || '0' }}
                          </button>
                          
                          <button class="inline-flex items-center gap-1 hover:text-blue-500 transition-colors cursor-default group" title="Views">
                            <svg class="h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            {{ reply.views || '0' }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                
                <div v-if="thread.hasMoreReplies && thread.nextMoreUrl" :class="{ 'ml-8': thread.isNestedThread }" class="py-2 px-4">
                  <a 
                    :href="thread.nextMoreUrl" 
                    target="_blank"
                    class="text-blue-500 hover:underline text-sm inline-flex items-center gap-1"
                  >
                    <EllipsisHorizontalIcon class="h-4 w-4" />
                    {{ t('modal.moreReplies') }}
                  </a>
                </div>
              </div>
            </template>
            
            <div v-else-if="!loadingReplies && replyThreads.length === 0" class="p-4 text-center text-gray-400 text-sm">
              {{ t('modal.noReplies') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted, computed, onMounted } from 'vue'
import { 
  ExclamationTriangleIcon, 
  ArrowTopRightOnSquareIcon,
  EllipsisHorizontalIcon
} from '@heroicons/vue/24/outline'
import Hls from 'hls.js'
import nitterApi from '../utils/api'
import { useI18n } from '../i18n'

const { t } = useI18n()

const props = defineProps({
  media: Object,
  authorInfo: Object
})

defineEmits(['close'])

const videoRef = ref(null)
const videoError = ref(false)
const videoErrorMsg = ref('')
const replyThreads = ref([])
const loadingReplies = ref(false)
const modalOverlay = ref(null)
const usernameCache = ref({})
let hlsInstance = null

const imgRef = ref(null)
const imgScale = ref(1)
const imgFullscreen = ref(false)
const imgOffsetX = ref(0)
const imgOffsetY = ref(0)
let isDragging = false
let dragStartX = 0
let dragStartY = 0
let dragOffsetX = 0
let dragOffsetY = 0

const imgStyle = computed(() => {
  if (!imgFullscreen.value) return {}
  return {
    transform: `scale(${imgScale.value}) translate(${imgOffsetX.value}px, ${imgOffsetY.value}px)`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.15s ease',
    maxWidth: '100vw',
    maxHeight: '100vh',
    cursor: imgScale.value > 1 ? 'grab' : 'zoom-out',
  }
})

const toggleFullscreen = () => {
  if (!imgFullscreen.value) {
    imgFullscreen.value = true
    imgScale.value = 1
    imgOffsetX.value = 0
    imgOffsetY.value = 0
  } else {
    if (imgScale.value > 1) {
      imgScale.value = 1
      imgOffsetX.value = 0
      imgOffsetY.value = 0
    } else {
      imgFullscreen.value = false
    }
  }
}

const onImgWheel = (e) => {
  if (!imgFullscreen.value) return
  const delta = e.deltaY > 0 ? -0.15 : 0.15
  imgScale.value = Math.max(0.5, Math.min(10, imgScale.value + delta))
  if (imgScale.value <= 1) {
    imgOffsetX.value = 0
    imgOffsetY.value = 0
  }
}

const onImgMouseDown = (e) => {
  if (!imgFullscreen.value || imgScale.value <= 1) return
  isDragging = true
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragOffsetX = imgOffsetX.value
  dragOffsetY = imgOffsetY.value
}

const onImgMouseMove = (e) => {
  if (!isDragging) return
  imgOffsetX.value = dragOffsetX + (e.clientX - dragStartX) / imgScale.value
  imgOffsetY.value = dragOffsetY + (e.clientY - dragStartY) / imgScale.value
}

const onImgMouseUp = () => {
  isDragging = false
}

const xUrl = computed(() => {
  if (!props.media?.tweetId || !props.media?.author) return '#'
  return `https://x.com/${props.media.author}/status/${props.media.tweetId}`
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  let date
  const nitterMatch = dateStr.match(/(\w+ \d+, \d+) · (\d+:\d+) (\w+)/)
  const rssMatch = dateStr.match(/\w+, (\d+ \w+ \d+) (\d+:\d+:\d+)/)
  
  if (nitterMatch) {
    date = new Date(nitterMatch[1])
    let hours = parseInt(nitterMatch[2].split(':')[0])
    const minutes = nitterMatch[2].split(':')[1]
    if (nitterMatch[3] === 'PM' && hours !== 12) hours += 12
    else if (nitterMatch[3] === 'AM' && hours === 12) hours = 0
    date.setHours(hours, parseInt(minutes))
  } else if (rssMatch) {
    date = new Date(`${rssMatch[1]} ${rssMatch[2]}`)
  } else {
    date = new Date(dateStr)
  }
  
  if (isNaN(date.getTime())) return dateStr
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const currentYear = new Date().getFullYear()
  
  if (year === currentYear) return `${month}-${day} ${time}`
  return `${year}-${month}-${day} ${time}`
}

const formatReplyDate = formatDate

const formatTweetContent = (text) => {
  if (!text) return ''
  return text.replace(/@(\w+)/g, (match, username) => {
    const displayName = usernameCache.value[username] || `@${username}`
    return `<a href="https://x.com/${username}" target="_blank" class="text-blue-500 hover:underline">${displayName}</a>`
  })
}

const preventBackgroundScroll = () => {
  document.body.style.overflow = 'hidden'
}

const restoreBackgroundScroll = () => {
  document.body.style.overflow = ''
}

const extractUsernames = (text) => {
  if (!text) return []
  const matches = text.match(/@(\w+)/g) || []
  return [...new Set(matches.map(m => m.substring(1)))]
}

const fetchUsernames = async (usernames) => {
  if (!usernames || usernames.length === 0) return
  
  const uncached = usernames.filter(u => !usernameCache.value[u])
  if (uncached.length === 0) return
  
  try {
    const dbMap = await nitterApi.resolveUsernames(uncached)
    for (const [username, name] of Object.entries(dbMap)) {
      usernameCache.value[username] = name
    }
    
    const stillMissing = uncached.filter(u => !dbMap[u])
    if (stillMissing.length === 0) return
    
    const promises = stillMissing.map(username => 
      nitterApi.getUser(username).catch(err => {
        console.error(`Failed to fetch user ${username}:`, err)
        return null
      })
    )
    
    const responses = await Promise.all(promises)
    responses.forEach((data, index) => {
      if (data) {
        const username = stillMissing[index]
        usernameCache.value[username] = data.name || username
      }
    })
  } catch (err) {
    console.error('Failed to fetch usernames:', err)
  }
}

const fetchReplies = async () => {
  if (!props.media?.tweetUrl) return
  
  loadingReplies.value = true
  try {
    const data = await nitterApi.getTweetReplies(props.media.author, props.media.tweetId)
    replyThreads.value = data.replyThreads || []
    
    const allUsernames = new Set()
    replyThreads.value.forEach(thread => {
      thread.items.forEach(reply => {
        extractUsernames(reply.text).forEach(u => allUsernames.add(u))
        if (reply.replyingTo && reply.replyingTo.length > 0) {
          reply.replyingTo.forEach(u => allUsernames.add(u))
        }
      })
    })
    
    await fetchUsernames([...allUsernames])
  } catch (err) {
    console.error('Failed to fetch replies:', err)
    replyThreads.value = []
  } finally {
    loadingReplies.value = false
  }
}

const initVideo = () => {
  if (!props.media || props.media.type === 'photo' || !videoRef.value) return
  
  videoError.value = false
  videoErrorMsg.value = ''
  
  const videoUrl = props.media.url
  
  const isHLS = videoUrl.includes('.m3u8') || videoUrl.includes('/video/')
  
  if (isHLS && Hls.isSupported()) {
    if (hlsInstance) {
      hlsInstance.destroy()
    }
    
    hlsInstance = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      startLevel: -1,
      capLevelToPlayerSize: false,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      xhrSetup: (xhr) => {
        xhr.withCredentials = false
      }
    })
    
    hlsInstance.loadSource(videoUrl)
    hlsInstance.attachMedia(videoRef.value)
    
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      if (data.levels.length > 0) {
        const maxLevel = data.levels.length - 1
        hlsInstance.currentLevel = maxLevel
      }
      videoRef.value.play().catch(() => {})
    })
    
    hlsInstance.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS error:', data)
      if (data.fatal) {
        videoError.value = true
        videoErrorMsg.value = data.type === 'networkError' ? 'Network error' : 'Video format error'
        hlsInstance.destroy()
      }
    })
  } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
    videoRef.value.src = videoUrl
  } else {
    videoRef.value.src = videoUrl
  }
}

watch(() => props.media, async () => {
  imgFullscreen.value = false
  imgScale.value = 1
  imgOffsetX.value = 0
  imgOffsetY.value = 0
  if (props.media && props.media.type === 'video') {
    setTimeout(initVideo, 100)
  }
  if (props.media) {
    const tweetUsernames = extractUsernames(props.media.text)
    await fetchUsernames(tweetUsernames)
    
    fetchReplies()
  }
}, { immediate: true })

onMounted(() => {
  preventBackgroundScroll()
})

onUnmounted(() => {
  if (hlsInstance) {
    hlsInstance.destroy()
  }
  restoreBackgroundScroll()
})

const onVideoError = (e) => {
  console.error('Video error:', e)
  videoError.value = true
  videoErrorMsg.value = t('modal.videoLoadFailed')
}
</script>

<style scoped>
.video-player {
  cursor: default;
}

.avatar.round {
  border-radius: 50%;
}

.reply-item {
  position: relative;
}

.reply-item.ml-8 {
  background-color: rgba(249, 250, 251, 0.5);
}

.dark .reply-item.ml-8 {
  background-color: rgba(39, 39, 42, 0.3);
}
</style>
