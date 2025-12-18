<template>
  <div class="home-view">
    <About :about-data="aboutData" />
  </div>
</template>

<script setup lang="ts">
import About from '../components/About.vue'
import type { AboutData } from '../types'

interface Props {
  aboutData?: AboutData
}

defineProps<Props>()
</script>

<style scoped>
.home-view {
  flex: 1;
}
</style>