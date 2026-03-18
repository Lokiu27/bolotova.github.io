<template>
  <div class="home-view">
    <About
      :about-data="aboutData"
      :homepage-blocks-data="homepageBlocksData"
      :telegram-url="contactData?.telegram"
    />
  </div>
</template>

<script setup lang="ts">
import About from '../components/About.vue'
import type { AboutData, ContactsData, HomepageBlocksData } from '../types'

interface Props {
  aboutData?: AboutData
  homepageBlocksData?: HomepageBlocksData
  contactData?: ContactsData
}

defineProps<Props>()
</script>

<style scoped>
.home-view {
  flex: 1;
}
</style>