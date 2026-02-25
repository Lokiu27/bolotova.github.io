<template>
  <GlassCard
    :blur="blur"
    :opacity="opacity"
    :borderOpacity="borderOpacity"
    :glowOnHover="glowOnHover"
    :cyberCorners="cyberCorners"
    :padding="padding"
    class="glass-panel"
  >
    <template v-if="$slots.header" #header>
      <slot name="header"></slot>
    </template>
    
    <slot></slot>
    
    <template v-if="$slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </GlassCard>
</template>

<script setup lang="ts">
import GlassCard from './GlassCard.vue';

interface GlassPanelProps {
  blur?: number;
  opacity?: number;
  borderOpacity?: number;
  glowOnHover?: boolean;
  cyberCorners?: boolean;
  padding?: string;
}

// Default props оптимизированы для sidebar использования
withDefaults(defineProps<GlassPanelProps>(), {
  blur: 12,
  opacity: 0.05,
  borderOpacity: 0.15,
  glowOnHover: false,
  cyberCorners: false,
  padding: '24px'
});
</script>

<style scoped>
.glass-panel {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  contain: layout style;
}

/* Адаптация для sidebar использования */
.glass-panel :deep(.glass-card-content) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Убираем hover transform для панелей */
.glass-panel:hover {
  transform: none;
}
</style>
