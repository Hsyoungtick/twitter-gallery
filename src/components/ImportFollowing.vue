<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="$emit('close')">
    <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between p-4 border-b dark:border-zinc-700">
        <h2 class="text-lg font-bold">{{ t('importFollowing.title') }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>
      
      <div class="p-4 overflow-y-auto flex-1">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {{ t('importFollowing.hint') }}
        </p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {{ t('importFollowing.htmlContent') }}
          </label>
          <textarea
            v-model="htmlContent"
            :placeholder="t('importFollowing.pasteHtmlHere')"
            class="w-full px-3 py-2 border dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            rows="8"
            :disabled="loading"
          ></textarea>
          
          <div class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-gray-600 dark:text-gray-400">
            <p class="font-medium mb-1">{{ t('importFollowing.howToGet') }}</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>{{ t('importFollowing.step1') }}</li>
              <li>{{ t('importFollowing.step2') }}</li>
              <li>{{ t('importFollowing.step3') }}</li>
              <li>{{ t('importFollowing.step4') }}</li>
            </ol>
          </div>
        </div>
        
        <div v-if="loading" class="my-6 text-center">
          <div class="spinner mx-auto mb-3"></div>
          <p class="text-sm text-gray-500">{{ t('importFollowing.parsingHtml') }}</p>
        </div>
        
        <div v-else-if="importedUsers.length > 0" class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-green-600">
              ✓ {{ t('importFollowing.foundUsers', { count: importedUsers.length }) }}
            </p>
            <label class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="rounded" />
              {{ t('importFollowing.selectAll') }}
            </label>
          </div>
          
          <div class="max-h-48 overflow-y-auto border dark:border-zinc-600 rounded-lg">
            <div 
              v-for="(user, index) in importedUsers" 
              :key="index"
              class="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-700 border-b last:border-b-0 dark:border-zinc-600"
            >
              <input 
                type="checkbox" 
                v-model="selectedUsers" 
                :value="user"
                class="rounded flex-shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium truncate">@{{ user }}</p>
              </div>
            </div>
          </div>
          
          <p v-if="selectedUsers.length > 0" class="text-xs text-gray-500 mt-2">
            {{ t('importFollowing.selectedUsers', { count: selectedUsers.length }) }}
          </p>
        </div>
        
        <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>
      </div>
      
      <div class="flex items-center justify-end gap-2 p-4 border-t dark:border-zinc-700">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          {{ t('importFollowing.cancel') }}
        </button>
        <button 
          v-if="!loading && importedUsers.length === 0"
          @click="handleExtract"
          :disabled="!htmlContent.trim()"
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {{ t('importFollowing.extractUsernames') }}
        </button>
        <button 
          v-if="importedUsers.length > 0"
          @click="handleConfirm"
          :disabled="selectedUsers.length === 0"
          class="px-4 py-2 bg-green-500 hover:green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {{ t('importFollowing.importCount', { count: selectedUsers.length }) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useI18n } from '../i18n'

const { t } = useI18n()

const emit = defineEmits(['close', 'import'])

const htmlContent = ref('')
const loading = ref(false)
const error = ref('')
const importedUsers = ref([])
const selectedUsers = ref([])

const canExtract = computed(() => {
  return htmlContent.value.trim().length > 0
})

const selectAll = computed({
  get: () => selectedUsers.value.length === importedUsers.value.length && importedUsers.value.length > 0,
  set: () => {}
})

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedUsers.value = []
  } else {
    selectedUsers.value = [...importedUsers.value]
  }
}

const handleExtract = async () => {
  if (!canExtract.value) return
  
  loading.value = true
  error.value = ''
  importedUsers.value = []
  selectedUsers.value = []
  
  try {
    const html = htmlContent.value
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const usernames = new Set()
    
    const links = doc.querySelectorAll('a[href]')
    links.forEach(link => {
      const href = link.getAttribute('href') || ''
      const match = href.match(/\/([a-zA-Z0-9_]{1,15})$/)
      if (match && !['home', 'explore', 'notifications', 'messages', 'bookmarks', 'lists', 'profile', 'settings', 'i', 'search', 'compose'].includes(match[1])) {
        usernames.add(match[1])
      }
    })
    
    const textContent = doc.body.textContent || ''
    const atMentions = textContent.match(/@([a-zA-Z0-9_]{1,15})/g)
    if (atMentions) {
      atMentions.forEach(mention => {
        const username = mention.substring(1)
        if (!['reply', 'mention', 'quote'].includes(username.toLowerCase())) {
          usernames.add(username)
        }
      })
    }
    
    const elementsWithUser = doc.querySelectorAll('[data-user-id], [data-screen-name], [data-name]')
    elementsWithUser.forEach(el => {
      const screenName = el.getAttribute('data-screen-name')
      if (screenName) usernames.add(screenName)
    })
    
    const userList = Array.from(usernames).filter(u => /^[a-zA-Z0-9_]+$/.test(u)).sort()
    
    if (userList.length === 0) {
      error.value = t('importFollowing.noUsernamesFound')
    } else {
      importedUsers.value = userList
      selectedUsers.value = [...userList]
    }
    
  } catch (err) {
    console.error('Extract error:', err)
    error.value = t('importFollowing.parseFailed', { error: err.message })
  } finally {
    loading.value = false
  }
}

const handleConfirm = () => {
  if (selectedUsers.value.length === 0) return
  
  const usersToImport = selectedUsers.value.map(username => ({
    username,
    name: username
  }))
  
  emit('import', usersToImport)
  emit('close')
}
</script>

<style scoped>
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.dark .spinner {
  border-color: #52525b;
  border-top-color: #3b82f6;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
