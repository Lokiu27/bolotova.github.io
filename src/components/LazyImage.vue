<template>
  <img
    ref="imageRef"
    :alt="alt"
    :class="['lazy-image', { 'loaded': isLoaded, 'loading': isLoading }]"
    @load="onLoad"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { lazyImageLoader } from '../utils/performance'

interface Props {
  src: string
  alt: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg=='
})

const imageRef = ref<HTMLImageElement>()
const isLoaded = ref(false)
const isLoading = ref(true)

const onLoad = () => {
  isLoaded.value = true
  isLoading.value = false
}

const onError = () => {
  isLoading.value = false
  // Could set a fallback image here
}

onMounted(() => {
  if (imageRef.value) {
    // Set up lazy loading
    imageRef.value.src = props.placeholder
    imageRef.value.dataset.src = props.src
    lazyImageLoader.observe(imageRef.value)
  }
})

onUnmounted(() => {
  if (imageRef.value) {
    lazyImageLoader.disconnect()
  }
})
</script>

<style scoped>
.lazy-image {
  transition: opacity 0.3s ease-in-out;
  opacity: 0;
}

.lazy-image.loading {
  opacity: 0.5;
}

.lazy-image.loaded {
  opacity: 1;
}

/* Optimize image rendering */
.lazy-image {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  image-rendering: optimize-contrast;
}
</style>