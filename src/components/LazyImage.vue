<template>
  <img
    ref="imageRef"
    :src="src"
    :alt="alt"
    loading="lazy"
    :class="['lazy-image', { 'loaded': isLoaded, 'loading': isLoading }]"
    @load="onLoad"
    @error="onError"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  src: string
  alt: string
}

const props = defineProps<Props>()

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