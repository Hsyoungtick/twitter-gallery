<template>
  <div class="following-list">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-bold">{{ t('followingList.title') }}</h2>
      <button
        @click="$emit('add')"
        class="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        :title="t('followingList.addUser')"
      >
        <PlusIcon class="h-4 w-4" />
      </button>
    </div>
    
    <div class="space-y-2">
      <div
        v-for="user in following"
        :key="user.username"
        @click="$emit('select', user.username)"
        :class="[
          'p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between',
          activeUser === user.username
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700'
        ]"
      >
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full bg-gray-300 dark:bg-zinc-600 flex items-center justify-center overflow-hidden">
            <img
              v-if="user.avatar"
              :src="user.avatar"
              class="w-full h-full object-cover"
              @error="$event.target.style.display = 'none'"
            />
            <UserIcon v-else class="h-5 w-5" />
          </div>
          <div>
            <div class="font-medium">{{ user.displayName || user.username }}</div>
            <div class="text-sm opacity-70">@{{ user.username }}</div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click.stop="$emit('refresh', user.username)"
            class="p-1 rounded hover:bg-white/20 transition-colors"
            :title="t('followingList.refresh')"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </button>
          <button
            @click.stop="$emit('delete', user.username)"
            class="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
            :title="t('followingList.delete')"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UserIcon, PlusIcon, ArrowPathIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { useI18n } from '../i18n'

const { t } = useI18n()

defineProps({
  following: Array,
  activeUser: String
})

defineEmits(['select', 'refresh', 'add', 'delete'])
</script>
