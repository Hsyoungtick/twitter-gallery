<template>
  <div class="gallery-page" ref="galleryContainer">
    <div v-if="loading && mediaItems.length === 0" class="spinner my-10 mx-auto"></div>
    
    <div v-if="error" class="my-5 w-full text-red-500 border-4 border-red-500 text-center p-2 font-bold text-lg">
      {{ error }}
    </div>
    
    <MediaGrid
      v-if="displayedMedia.length"
      :media="displayedMedia"
      @open="openModal"
    />
    
    <div ref="loadMoreTrigger" class="h-20"></div>
    
    <div 
      v-if="displayCount >= displayedMedia.length && displayedMedia.length > 0 && !loading" 
      class="text-center py-5 text-gray-400"
    >
      {{ t('gallery.allContentLoaded') }}
    </div>
    
    <div v-if="!loading && mediaItems.length === 0 && usersInfo.length > 0" class="text-center py-20 text-gray-500">
      <p class="text-xl">{{ t('gallery.noMediaContent') }}</p>
    </div>
    
    <router-view v-slot="{ Component }">
      <transition name="fade">
        <component :is="Component" :media="currentMedia" :author-info="currentAuthorInfo" @close="closeModal" />
      </transition>
    </router-view>
    
    <AddUserModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @add="handleAddUser"
    />

    <FollowingModal
      v-if="showFollowingModal"
      :users="usersInfo"
      :loading="loading"
      @close="showFollowingModal = false"
      @add="showFollowingModal = false; showAddModal = true"
      @delete="handleDeleteFromModal"
      @select="handleSelectUser"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import MediaGrid from '../components/MediaGrid.vue'
import AddUserModal from '../components/AddUserModal.vue'
import FollowingModal from '../components/FollowingModal.vue'
import { useFollowing } from '../composables/useFollowing'
import nitterApi from '../utils/api'
import { useI18n } from '../i18n'

const { t } = useI18n()

const router = useRouter()
const { followingList, addFollowing, removeFollowing, updateFollowing, loadFollowing } = useFollowing()
const showFollowingModal = inject('showFollowingModal')
const refreshing = inject('refreshing')
const refreshResult = inject('refreshResult')
const refreshProgress = inject('refreshProgress')
const filterUser = inject('filterUser')
const handleRefreshFn = inject('handleRefresh')
const clearFilterFn = inject('clearFilter')

const galleryContainer = ref(null)
const loadMoreTrigger = ref(null)
const usersInfo = ref([])
const mediaItems = ref([])
const displayCount = ref(0)
const loading = ref(false)
const error = ref('')
const currentMedia = ref(null)
const showAddModal = ref(false)

const PAGE_SIZE = 50

const displayedMedia = computed(() => {
  const items = filterUser.value
    ? mediaItems.value.filter(m => m.author === filterUser.value)
    : mediaItems.value
  return items.slice(0, displayCount.value)
})

const handleSelectUser = (username) => {
  if (filterUser.value === username) {
    filterUser.value = null
  } else {
    filterUser.value = username
  }
  displayCount.value = Math.min(PAGE_SIZE, displayedMedia.value.length || mediaItems.value.length)
}

clearFilterFn.value = () => {
  filterUser.value = null
  displayCount.value = Math.min(PAGE_SIZE, mediaItems.value.length)
}

const loadFeed = async (isInitial = false) => {
  if (followingList.value.length === 0) return
  
  if (isInitial) {
    loading.value = true
    mediaItems.value = []
    displayCount.value = 0
    usersInfo.value = []
  }
  
  error.value = ''
  
  try {
    const usernames = followingList.value.map(u => u.username)
    
    const result = await nitterApi.getFeedBatch(usernames)
    
    if (result.usersInfo) {
      usersInfo.value = result.usersInfo
      for (const user of result.usersInfo) {
        updateFollowing(user.username, {
          displayName: user.name,
          avatar: user.avatar
        })
      }
    }
    
    if (result.media && result.media.length > 0) {
      mediaItems.value = result.media
    }
    
    if (isInitial) {
      displayCount.value = Math.min(PAGE_SIZE, mediaItems.value.length)
    }
    
    if (mediaItems.value.length === 0 && followingList.value.length > 0) {
      loading.value = false
      await handleRefresh()
      return
    }

    if (result.usersInfo && result.usersInfo.some(u => !u.avatar) && followingList.value.length > 0) {
      loading.value = false
      await handleRefresh()
      return
    }
    
  } catch (err) {
    error.value = t('gallery.loadFailed', { error: err.message })
    console.error('[feed]', err)
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  if (followingList.value.length === 0 || refreshing.value) return
  
  refreshing.value = true
  refreshResult.value = ''
  refreshProgress.value = null
  
  try {
    const usernames = followingList.value.map(u => u.username)
    const result = await nitterApi.refreshFeed(usernames, (event) => {
      refreshProgress.value = event
    })
    
    if (result.usersInfo) {
      usersInfo.value = result.usersInfo
      for (const user of result.usersInfo) {
        updateFollowing(user.username, {
          displayName: user.name,
          avatar: user.avatar
        })
      }
    }
    
    if (result.media) {
      mediaItems.value = result.media
      displayCount.value = Math.min(PAGE_SIZE, mediaItems.value.length)
    }
    
    refreshResult.value = t('gallery.refreshResult', { updated: result.updated || 0, newPosts: result.newPosts || 0 })
    setTimeout(() => { refreshResult.value = '' }, 5000)
  } catch (err) {
    refreshResult.value = t('gallery.refreshFailed', { error: err.message })
    console.error('[refresh]', err)
  } finally {
    refreshing.value = false
    refreshProgress.value = null
  }
}

handleRefreshFn.value = handleRefresh

const loadMore = () => {
  const total = filterUser.value
    ? mediaItems.value.filter(m => m.author === filterUser.value).length
    : mediaItems.value.length
  if (displayCount.value < total) {
    displayCount.value = Math.min(displayCount.value + PAGE_SIZE, total)
    resetObserver()
  }
}

const currentAuthorInfo = computed(() => {
  if (!currentMedia.value) return null
  return usersInfo.value.find(u => u.username === currentMedia.value.author)
})

const openModal = (media) => {
  currentMedia.value = media
  router.push({
    name: 'modal',
    params: { id: media.id }
  })
}

const closeModal = () => {
  router.push({ name: 'gallery' })
}

const handleAddUser = async (username) => {
  await addFollowing(username)
  showAddModal.value = false

  updateFollowing(username, {
    displayName: username,
    avatar: null
  })

  try {
    const result = await nitterApi.importUser(username)

    if (result.userInfo) {
      updateFollowing(username, {
        displayName: result.userInfo.name,
        avatar: result.userInfo.avatar
      })

      const exists = usersInfo.value.some(u => u.username === username)
      if (!exists) {
        usersInfo.value.push(result.userInfo)
      } else {
        const idx = usersInfo.value.findIndex(u => u.username === username)
        if (idx !== -1) usersInfo.value[idx] = result.userInfo
      }
    }

    if (result.media && result.media.length > 0) {
      const existingIds = new Set(mediaItems.value.map(m => m.id))
      const newMedia = result.media.filter(m => !existingIds.has(m.id))
      if (newMedia.length > 0) {
        mediaItems.value = [...newMedia, ...mediaItems.value]
        displayCount.value = Math.min(displayCount.value + newMedia.length, mediaItems.value.length)
      }
    }
  } catch (err) {
    console.error('[add-user] ' + t('gallery.importUserFailed') + ':', err)
  }
}

const handleDeleteUser = async (username) => {
  if (confirm(t('gallery.confirmDelete', { user: username }))) {
    await removeFollowing(username)
    usersInfo.value = usersInfo.value.filter(u => u.username !== username)
    mediaItems.value = mediaItems.value.filter(m => m.author !== username)
  }
}

const handleDeleteFromModal = async (username) => {
  if (confirm(t('gallery.confirmDelete', { user: username }))) {
    await removeFollowing(username)
    usersInfo.value = usersInfo.value.filter(u => u.username !== username)
    mediaItems.value = mediaItems.value.filter(m => m.author !== username)
  }
}

let observer = null

const setupObserver = () => {
  if (observer) observer.disconnect()
  
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && displayCount.value < mediaItems.value.length && !loading.value) {
        loadMore()
      }
    },
    { threshold: 0.1 }
  )
  
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

const resetObserver = () => {
  if (!observer || !loadMoreTrigger.value) return
  observer.unobserve(loadMoreTrigger.value)
  requestAnimationFrame(() => {
    if (loadMoreTrigger.value) {
      observer.observe(loadMoreTrigger.value)
    }
  })
}

onMounted(async () => {
  await nitterApi.checkBackendAndInit()
  await loadFollowing()
  await loadFeed(true)
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
