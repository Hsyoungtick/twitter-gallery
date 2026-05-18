<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      @click.self="$emit('close')"
    >
      <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b dark:border-zinc-700">
          <h2 class="text-lg font-bold">{{ t('followingModal.title', { count: filteredUsers.length }) }}</h2>
          <div class="flex items-center gap-2">
            <button
              @click="$emit('add')"
              class="p-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              :title="t('followingModal.addUser')"
            >
              <PlusIcon class="h-4 w-4" />
            </button>
            <button
              @click="$emit('close')"
              class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 transition-colors"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 px-4 py-2 border-b dark:border-zinc-700">
          <div class="flex-1 relative">
            <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('followingModal.searchUsername')"
              class="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select
            v-model="sortBy"
            class="px-2 py-1.5 text-sm border rounded-lg dark:bg-zinc-700 dark:border-zinc-600 outline-none"
          >
            <option value="latest">{{ t('followingModal.sortLatest') }}</option>
            <option value="name">{{ t('followingModal.sortName') }}</option>
            <option value="mediaCount">{{ t('followingModal.sortMediaCount') }}</option>
          </select>
        </div>

        <div v-if="loading" class="flex-1 flex items-center justify-center p-8">
          <div class="spinner"></div>
        </div>

        <div v-else class="flex-1 overflow-y-auto p-4">
          <div v-if="filteredUsers.length === 0" class="text-center py-12 text-gray-500">
            <UserIcon class="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-zinc-600" />
            <p>{{ searchQuery ? t('followingModal.noMatchingUser') : t('followingModal.noFollowingUser') }}</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(user, idx) in filteredUsers"
              :key="user.username"
              class="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-zinc-700/50 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors group cursor-pointer"
              @click="$emit('select', user.username)"
            >
              <div class="w-6 text-center text-xs font-bold text-gray-400 dark:text-zinc-500 flex-shrink-0">
                #{{ idx + 1 }}
              </div>

              <div class="w-12 h-12 rounded-full bg-gray-300 dark:bg-zinc-600 flex-shrink-0 overflow-hidden">
                <img
                  v-if="user.avatar"
                  :src="user.avatar"
                  class="w-full h-full object-cover"
                  loading="eager"
                  @error="$event.target.style.display = 'none'"
                />
                <UserIcon v-else class="h-6 w-6 m-3 text-gray-400 dark:text-zinc-500" />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium truncate">{{ user.name || user.username }}</span>
                  <span class="text-sm text-gray-400 dark:text-zinc-500 truncate">@{{ user.username }}</span>
                </div>
                <div class="flex gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ t('followingModal.followers') }} <strong class="text-gray-700 dark:text-gray-300">{{ user.followers || '0' }}</strong></span>
                  <span>{{ t('followingModal.media') }} <strong class="text-gray-700 dark:text-gray-300">{{ user.mediaCount || 0 }}</strong></span>
                  <span v-if="user.latestTweetDate" class="truncate">
                    {{ formatDate(user.latestTweetDate) }}
                  </span>
                </div>
              </div>

              <a
                :href="'https://x.com/' + user.username"
                target="_blank"
                rel="noopener noreferrer"
                @click.stop
                class="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-blue-500/20 text-blue-500 transition-all flex-shrink-0"
                :title="t('followingModal.viewOnX')"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              <button
                @click.stop="$emit('delete', user.username)"
                class="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 transition-all flex-shrink-0"
                :title="t('followingModal.deleteUser')"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { XMarkIcon, PlusIcon, UserIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useI18n } from '../i18n'

const { t, currentLocale } = useI18n()

const props = defineProps({
  users: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

defineEmits(['close', 'add', 'delete', 'select'])

const searchQuery = ref('')
const sortBy = ref('latest')

const parseDate = (s) => {
  if (!s || typeof s !== 'string') return new Date(0)
  const nitterMatch = s.match(/(\w+ \d+, \d+) · (\d+:\d+) (\w+)/)
  if (nitterMatch) {
    return new Date(`${nitterMatch[1]} ${nitterMatch[2]} ${nitterMatch[3]} UTC`)
  }
  return new Date(s.replace(/·/g, '') + ' UTC')
}

const filteredUsers = computed(() => {
  let list = [...props.users]

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q)
    )
  }

  list.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return (a.name || a.username).localeCompare(b.name || b.username)
      case 'mediaCount':
        return (b.mediaCount || 0) - (a.mediaCount || 0)
      case 'latest':
      default:
        return parseDate(b.latestTweetDate) - parseDate(a.latestTweetDate)
    }
  })

  return list
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = parseDate(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const useLocal = currentLocale.value === 'zh'
  const year = useLocal ? d.getFullYear() : d.getUTCFullYear()
  const month = pad((useLocal ? d.getMonth() : d.getUTCMonth()) + 1)
  const day = pad(useLocal ? d.getDate() : d.getUTCDate())
  const hour = pad(useLocal ? d.getHours() : d.getUTCHours())
  const minute = pad(useLocal ? d.getMinutes() : d.getUTCMinutes())
  const time = `${hour}:${minute}`
  const currentYear = useLocal ? now.getFullYear() : now.getUTCFullYear()
  if (currentLocale.value === 'zh') {
    if (year === currentYear) {
      return `${month}月${day}日 ${time}`
    }
    return `${year}年${month}月${day}日 ${time}`
  }
  if (year === currentYear) {
    return `${month}-${day} ${time}`
  }
  return `${year}-${month}-${day} ${time}`
}
</script>
