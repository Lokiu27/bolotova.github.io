<template>
  <section class="cta-block" aria-labelledby="cta-heading">
    <div class="section-label">{{ data.label }}</div>
    <h2 id="cta-heading" class="visually-hidden">Следующий шаг</h2>
    <p class="cta-situations">{{ data.situations }}</p>
    <p class="cta-call-to-action">{{ data.callToAction }}</p>
    <a
      :href="telegramUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="cta-button"
      :aria-label="`${data.buttonText} — открыть в Telegram`"
    >
      {{ data.buttonText }}
    </a>
  </section>
</template>

<script setup lang="ts">
import type { CtaData } from '../types'

interface Props {
  data: CtaData
  telegramUrl: string
}

defineProps<Props>()
</script>

<style scoped>
.cta-block {
  background: rgba(14, 17, 22, 0.1);
  backdrop-filter: blur(var(--glass-blur, 10px));
  border: 1px solid rgba(61, 68, 80, 0.2);
  border-radius: var(--radius-md, 4px);
  padding: var(--grid-unit, 24px);
  margin-top: var(--grid-unit, 24px);
  text-align: center;
}

.section-label {
  font-size: var(--font-size-sm, 12px);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-mono);
  color: var(--text-tertiary, #7a8290);
  margin-bottom: 16px;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.cta-situations {
  font-size: var(--font-size-base, 14px);
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono);
  line-height: 1.7;
  margin-bottom: 12px;
}

.cta-call-to-action {
  font-size: var(--font-size-lg, 16px);
  color: var(--text-primary, #e0e0e0);
  font-family: var(--font-mono);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 28px;
}

.cta-button {
  display: inline-block;
  padding: 12px 32px;
  background: transparent;
  border: 1px solid var(--accent-cyan, #00f0ff);
  border-radius: var(--radius-md, 4px);
  color: var(--accent-cyan, #00f0ff);
  font-family: var(--font-mono);
  font-size: var(--font-size-base, 14px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-normal, 0.3s ease);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.1);
}

.cta-button:hover {
  background: var(--accent-cyan-dim, rgba(0, 240, 255, 0.1));
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
}

.cta-button:focus-visible {
  outline: var(--focus-outline-width, 2px) solid var(--focus-outline-color, var(--accent-cyan));
  outline-offset: var(--focus-outline-offset, 2px);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3), 0 0 0 4px rgba(0, 240, 255, 0.2);
}

@media (max-width: 767px) {
  .cta-block {
    padding: calc(var(--grid-unit, 16px) * 1.5);
  }

  .cta-button {
    width: 100%;
    text-align: center;
  }
}
</style>
