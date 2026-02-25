<template>
  <div 
    class="glass-card" 
    :class="{ 'glow-on-hover': glowOnHover, 'cyber-corners': cyberCorners, 'interactive': interactive }"
    :style="cardStyles"
    :tabindex="interactive ? 0 : undefined"
    :role="interactive ? 'button' : undefined"
    @keydown.enter="handleKeyboardActivation"
    @keydown.space.prevent="handleKeyboardActivation"
  >
    <div v-if="$slots.header" class="glass-card-header">
      <slot name="header"></slot>
    </div>
    
    <div class="glass-card-content">
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="glass-card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * GlassCard Component
 * 
 * A reusable glassmorphism card component with cyberpunk styling.
 * Features backdrop blur, customizable opacity, hover effects, and cyber corners.
 * 
 * @component
 * @example
 * ```vue
 * <GlassCard :blur="15" :opacity="0.2" :glow-on-hover="true">
 *   <template #header>
 *     <h3>Card Title</h3>
 *   </template>
 *   <p>Card content goes here</p>
 * </GlassCard>
 * ```
 */
import { computed } from 'vue';

/**
 * Props for the GlassCard component
 */
interface GlassCardProps {
  /** Blur intensity in pixels (default: 10) */
  blur?: number;
  /** Background opacity from 0 to 1 (default: 0.1) */
  opacity?: number;
  /** Border opacity from 0 to 1 (default: 0.2) */
  borderOpacity?: number;
  /** Enable glow effect on hover (default: true) */
  glowOnHover?: boolean;
  /** Show animated cyber corners on hover (default: true) */
  cyberCorners?: boolean;
  /** Internal padding (default: '32px') */
  padding?: string;
  /** Make card interactive with keyboard support (default: false) */
  interactive?: boolean;
}

const props = withDefaults(defineProps<GlassCardProps>(), {
  blur: 10,
  opacity: 0.1,
  borderOpacity: 0.2,
  glowOnHover: true,
  cyberCorners: true,
  padding: '32px',
  interactive: false
});

/**
 * Emits for the GlassCard component
 */
const emit = defineEmits<{
  /** Emitted when interactive card is activated via keyboard */
  activate: []
}>();

const cardStyles = computed(() => ({
  '--glass-blur': `${props.blur}px`,
  '--glass-opacity': props.opacity,
  '--glass-border-opacity': props.borderOpacity,
  '--glass-padding': props.padding
}));

const handleKeyboardActivation = () => {
  if (props.interactive) {
    emit('activate');
  }
};
</script>

<style scoped>
.glass-card {
  background: rgba(14, 17, 22, var(--glass-opacity));
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid rgba(61, 68, 80, var(--glass-border-opacity));
  border-radius: var(--radius-md, 4px);
  padding: var(--glass-padding);
  transition: all var(--transition-normal, 0.3s ease);
  position: relative;
  overflow: hidden;
  contain: layout style paint;
}

.glass-card.glow-on-hover:hover {
  border-color: var(--accent-cyan, #00f0ff);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
  will-change: transform, box-shadow;
}

/* Cyber corners */
.glass-card.cyber-corners::before,
.glass-card.cyber-corners::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid var(--accent-cyan, #00f0ff);
  opacity: 0;
  transition: opacity var(--transition-normal, 0.3s ease);
  pointer-events: none;
}

.glass-card.cyber-corners::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.glass-card.cyber-corners::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

.glass-card.cyber-corners:hover::before,
.glass-card.cyber-corners:hover::after {
  opacity: 1;
}

/* Interactive card styles */
.glass-card.interactive {
  cursor: pointer;
}

.glass-card.interactive:focus-visible {
  outline: var(--focus-outline-width) solid var(--focus-outline-color);
  outline-offset: var(--focus-outline-offset);
  border-color: var(--accent-cyan, #00f0ff);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3), 0 0 0 4px rgba(0, 240, 255, 0.2);
}

/* Fallback для браузеров без backdrop-filter */
@supports not (backdrop-filter: blur(10px)) {
  .glass-card {
    background: rgba(14, 17, 22, 0.8);
    border: 2px solid var(--border-bright, #3d4450);
  }
}

.glass-card-header {
  margin-bottom: 16px;
}

.glass-card-footer {
  margin-top: 16px;
}

.glass-card-content {
  flex: 1;
}
</style>
