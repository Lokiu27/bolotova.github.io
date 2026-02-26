<script setup lang="ts">
import { computed } from 'vue';

/**
 * Тип статуса системы
 */
export type StatusType = 'online' | 'offline' | 'away';

/**
 * Props компонента StatusPanel
 */
export interface StatusPanelProps {
  status: StatusType;
  statusText?: string;
  showDot?: boolean;
}

const props = withDefaults(defineProps<StatusPanelProps>(), {
  statusText: 'SYSTEM: ONLINE',
  showDot: true
});

/**
 * Вычисляет CSS класс для индикатора статуса
 */
const statusDotClass = computed(() => {
  return `status-dot status-dot--${props.status}`;
});

/**
 * Определяет, должна ли быть анимация pulse
 */
const shouldPulse = computed(() => {
  return props.status === 'online';
});
</script>

<template>
  <div class="status-panel">
    <div 
      v-if="showDot" 
      :class="statusDotClass"
      :aria-label="`Status: ${status}`"
      role="status"
    />
    <span class="status-text">{{ statusText }}</span>
  </div>
</template>

<style scoped>
.status-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--online {
  background-color: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
  animation: pulse 2s infinite;
  will-change: opacity, transform;
}

.status-dot--offline {
  background-color: var(--text-tertiary);
  box-shadow: none;
}

.status-dot--away {
  background-color: #ffa500;
  box-shadow: 0 0 8px rgba(255, 165, 0, 0.5);
}

.status-text {
  color: var(--text-secondary);
}

/* Pulse анимация для online статуса */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Уважение prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .status-dot--online {
    animation: none;
  }
}
</style>
