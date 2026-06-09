<template>
  <div id="app">
    <div class="dark:text-gray-50 pb-5 min-h-screen bg-gray-50 dark:bg-zinc-900">
      <div class="top-gradient h-3"></div>
      <div v-if="isDemo && !isEnvDemo" class="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium">
        {{ t('demo.noBackend') }}
      </div>
      <div v-else-if="isEnvDemo" class="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium">
        {{ t('demo.banner') }}
      </div>
      <div class="container mx-auto px-4">
        <Header />
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import Header from './components/Header.vue'
import { isDemoMode, isEnvDemoMode, demoModeRef } from './utils/api'
import { useI18n } from './i18n'

const { t } = useI18n()
const isEnvDemo = isEnvDemoMode()
// 使用响应式ref，后端检测完成后自动更新UI
const isDemo = demoModeRef

const showFollowingModal = ref(false)
const refreshing = ref(false)
const refreshResult = ref('')
const refreshProgress = ref(null)
const filterUser = ref(null)
const handleRefresh = ref(null)
const clearFilter = ref(null)
const shuffleMode = ref(false)
const toggleShuffle = ref(null)

provide('showFollowingModal', showFollowingModal)
provide('refreshing', refreshing)
provide('refreshResult', refreshResult)
provide('refreshProgress', refreshProgress)
provide('filterUser', filterUser)
provide('handleRefresh', handleRefresh)
provide('clearFilter', clearFilter)
provide('shuffleMode', shuffleMode)
provide('toggleShuffle', toggleShuffle)

onMounted(() => {
  // 自动检测系统深色模式
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
  const updateDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  updateDarkMode(prefersDark.matches)
  prefersDark.addEventListener('change', (e) => updateDarkMode(e.matches))
})
</script>
