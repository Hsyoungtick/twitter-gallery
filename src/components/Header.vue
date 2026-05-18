<template>
  <header class="my-7">
    <nav class="flex items-center justify-between">
      <div class="flex items-center">
        <svg class="h-8 w-auto mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        <span class="text-xl md:text-2xl uppercase font-bold">Twitter Gallery</span>
      </div>
      <div class="flex items-center space-x-2">
        <span v-if="isDemoMode()" class="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Demo</span>
        <template v-if="!isDemoMode()">
          <span v-if="refreshing && refreshProgress" class="text-xs text-blue-500 whitespace-nowrap">{{ refreshProgress.message }}</span>
          <span v-else-if="refreshing" class="text-xs text-blue-500 animate-pulse whitespace-nowrap">{{ t('header.refreshing') }}</span>
          <span v-else-if="refreshResult" class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ refreshResult }}</span>
          <button
            @click="handleRefresh?.()"
            :disabled="refreshing"
            class="p-2 rounded-lg bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors disabled:opacity-50"
            :title="t('header.refresh')"
          >
            <svg class="h-5 w-5" :class="{ 'animate-spin': refreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
        </template>
        <span v-if="filterUser" class="text-xs text-blue-500 font-medium whitespace-nowrap">@{{ filterUser }}</span>
        <button
          v-if="filterUser"
          @click="clearFilter?.()"
          class="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          :title="t('header.filter', { user: filterUser })"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18l-6.5 7.5v4.5L9.5 19v-7.5L3 4z"/>
          </svg>
        </button>
        <button
          @click="showFollowingModal = true"
          class="p-2 rounded-lg bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors relative"
          :title="t('header.followingList')"
        >
          <UsersIcon class="h-5 w-5" />
        </button>
        <button
          @click="toggleLocale"
          class="p-2 rounded-lg bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors text-sm font-bold min-w-[36px] text-center"
          :title="t('lang.switch')"
        >
          {{ localeLabel }}
        </button>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { inject } from 'vue'
import { UsersIcon } from '@heroicons/vue/24/outline'
import { useI18n } from '../i18n'
import { isDemoMode } from '../utils/api'

const { t, toggleLocale, localeLabel } = useI18n()

const showFollowingModal = inject('showFollowingModal')
const refreshing = inject('refreshing')
const refreshResult = inject('refreshResult')
const refreshProgress = inject('refreshProgress')
const filterUser = inject('filterUser')
const handleRefresh = inject('handleRefresh')
const clearFilter = inject('clearFilter')
</script>
