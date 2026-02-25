<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';

interface ScanlineOverlayProps {
  enabled?: boolean;
  opacity?: number;
  lineHeight?: number;
}

const props = withDefaults(defineProps<ScanlineOverlayProps>(), {
  enabled: true,
  opacity: 0.3,
  lineHeight: 4
});

const prefersReducedMotion = ref(false);
let mediaQuery: MediaQueryList | null = null;
let handleChange: ((e: MediaQueryListEvent) => void) | null = null;

onMounted(() => {
  // Check if matchMedia is available
  if (typeof window === 'undefined' || !window.matchMedia) {
    return;
  }
  
  // Check for prefers-reduced-motion preference
  mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  prefersReducedMotion.value = mediaQuery.matches;
  
  // Listen for changes to the preference
  handleChange = (e: MediaQueryListEvent) => {
    prefersReducedMotion.value = e.matches;
  };
  
  mediaQuery.addEventListener('change', handleChange);
});

onBeforeUnmount(() => {
  // Cleanup event listener
  if (mediaQuery && handleChange) {
    mediaQuery.removeEventListener('change', handleChange);
  }
});

const shouldDisplay = computed(() => {
  return props.enabled && !prefersReducedMotion.value;
});

const overlayStyle = computed(() => ({
  opacity: props.opacity,
  backgroundSize: `100% ${props.lineHeight}px`
}));
</script>

<template>
  <div
    v-if="shouldDisplay"
    class="scanline-overlay"
    :style="overlayStyle"
    aria-hidden="true"
  />
</template>

<style scoped>
.scanline-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    rgba(18, 16, 16, 0) 50%,
    rgba(0, 0, 0, 0.1) 50%
  );
  pointer-events: none;
  z-index: 9999;
}
</style>
