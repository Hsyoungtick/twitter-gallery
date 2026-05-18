<template>
  <div class="user-card bg-white dark:bg-zinc-800 rounded-lg p-4 mb-6 shadow">
    <div class="flex items-start space-x-4">
      <div class="w-16 h-16 rounded-full bg-gray-300 dark:bg-zinc-600 flex-shrink-0 overflow-hidden">
        <img
          v-if="user.avatar"
          :src="user.avatar"
          class="w-full h-full object-cover"
          @error="$event.target.style.display = 'none'"
        />
      </div>
      <div class="flex-1 min-w-0">
        <h2 class="text-xl font-bold truncate">{{ user.name }}</h2>
        <p class="text-gray-500 dark:text-gray-400">@{{ user.username }}</p>
        <p v-if="user.bio" class="mt-2 text-sm">{{ user.bio }}</p>
        <div class="flex space-x-4 mt-3 text-sm">
          <div>
            <span class="font-bold">{{ user.followers || '0' }}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-1">{{ t('userCard.followers') }}</span>
          </div>
          <div>
            <span class="font-bold">{{ user.mediaCount || user.media_count || '0' }}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-1">{{ t('userCard.media') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../i18n'

const { t } = useI18n()

defineProps({
  user: Object
})
</script>
