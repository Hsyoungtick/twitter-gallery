<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="$emit('close')"
    >
      <div class="bg-white dark:bg-zinc-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-bold mb-4">{{ t('addUser.title') }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('addUser.username') }}</label>
            <input
              v-model="username"
              type="text"
              :placeholder="t('addUser.enterUsername')"
              class="w-full px-3 py-2 border rounded-lg dark:bg-zinc-700 dark:border-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
              @keyup.enter="handleAdd"
            />
            <p class="text-xs text-gray-500 mt-1">{{ t('addUser.noAtSymbol') }}</p>
          </div>
          
          <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
          
          <div class="flex space-x-3">
            <button
              @click="$emit('close')"
              class="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              {{ t('addUser.cancel') }}
            </button>
            <button
              @click="handleAdd"
              :disabled="!username.trim()"
              class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {{ t('addUser.add') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

const emit = defineEmits(['close', 'add'])

const username = ref('')
const error = ref('')

const handleAdd = () => {
  const name = username.value.trim().replace('@', '')
  
  if (!name) {
    error.value = t('addUser.pleaseEnterUsername')
    return
  }
  
  emit('add', name)
}
</script>
