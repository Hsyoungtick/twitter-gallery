<template>
  <div id="app">
    <div class="dark:text-gray-50 pb-5 min-h-screen bg-gray-50 dark:bg-zinc-900">
      <div class="top-gradient h-3"></div>
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

const showFollowingModal = ref(false)
const refreshing = ref(false)
const refreshResult = ref('')
const refreshProgress = ref(null)
const filterUser = ref(null)
const handleRefresh = ref(null)
const clearFilter = ref(null)

provide('showFollowingModal', showFollowingModal)
provide('refreshing', refreshing)
provide('refreshResult', refreshResult)
provide('refreshProgress', refreshProgress)
provide('filterUser', filterUser)
provide('handleRefresh', handleRefresh)
provide('clearFilter', clearFilter)

onMounted(() => {
  if (localStorage.getItem('isDark') === 'true') {
    document.documentElement.classList.add('dark')
  }
})
</script>
