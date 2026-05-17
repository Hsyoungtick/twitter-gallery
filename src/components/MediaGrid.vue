<template>
  <div class="media-grid mt-5" ref="gridContainer">
    <div
      v-for="(item, index) in media"
      :key="item.id"
      :ref="el => setItemRef(el, index)"
      class="absolute bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden cursor-pointer group"
      :style="itemPositions[index] || {}"
      @click="$emit('open', item)"
    >
      <div class="relative">
        <img
          :src="item.previewUrl || item.url"
          :alt="item.text"
          class="w-full h-auto object-cover"
          loading="lazy"
          @load="onImageLoad(index)"
        />
        <div
          v-if="item.type === 'video'"
          class="absolute inset-0 flex items-center justify-center bg-black/30"
        >
          <PlayIcon class="h-16 w-16 text-white opacity-70" />
        </div>
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
        
        <!-- 左下角：评论数 -->
        <div class="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs bg-black/60 px-1.5 py-0.5 rounded">
          <ChatBubbleLeftIcon class="h-3 w-3" />
          {{ formatNumber(item.replies || '0') }}
        </div>
        
        <!-- 右下角：视频时长 -->
        <div 
          v-if="item.type === 'video' && item.duration" 
          class="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-white text-xs"
        >
          {{ item.duration }}
        </div>
      </div>
      <div v-if="item.text" class="p-2 text-sm">
        {{ item.text }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { PlayIcon, ChatBubbleLeftIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  media: Array
})

defineEmits(['open'])

const gridContainer = ref(null)
const itemRefs = {}
const itemPositions = ref({})
const columnHeights = ref([])

const GUTTER = 10

const getColCount = () => {
  const w = gridContainer.value?.clientWidth || 1200
  if (w < 576) return 1
  if (w < 768) return 2
  if (w < 1000) return 3
  return 4
}

const setItemRef = (el, index) => {
  if (el) itemRefs[index] = el
}

const formatNumber = (num) => {
  if (!num) return ''
  const n = parseFloat(num.replace(/,/g, ''))
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M'
  } else if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K'
  }
  return num
}

const layout = () => {
  if (!gridContainer.value || !props.media?.length) return

  const cols = getColCount()
  const containerWidth = gridContainer.value.clientWidth
  const colWidth = (containerWidth - GUTTER * (cols - 1)) / cols

  const heights = new Array(cols).fill(0)
  const positions = {}

  for (let i = 0; i < props.media.length; i++) {
    const el = itemRefs[i]
    let itemHeight = 200

    if (el) {
      itemHeight = el.offsetHeight
    }

    const minCol = heights.indexOf(Math.min(...heights))
    const x = minCol * (colWidth + GUTTER)
    const y = heights[minCol]

    positions[i] = {
      position: 'absolute',
      width: `${colWidth}px`,
      transform: `translate(${x}px, ${y}px)`,
    }

    heights[minCol] += itemHeight + GUTTER
  }

  itemPositions.value = positions
  columnHeights.value = heights

  const maxHeight = Math.max(...heights)
  gridContainer.value.style.height = `${maxHeight}px`
}

const onImageLoad = (index) => {
  nextTick(() => layout())
}

let resizeObserver = null

onMounted(() => {
  nextTick(() => layout())
  resizeObserver = new ResizeObserver(() => layout())
  if (gridContainer.value) {
    resizeObserver.observe(gridContainer.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})

watch(() => props.media, () => {
  nextTick(() => layout())
}, { deep: true })
</script>

<style scoped>
.media-grid {
  position: relative;
}

.media-grid .p-2 {
  word-wrap: break-word;
  white-space: normal;
}
</style>
