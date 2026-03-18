<template>
  <section class="formats-block" aria-labelledby="formats-heading">
    <div class="section-label">{{ data.label }}</div>
    <h2 id="formats-heading" class="block-title">{{ data.title }}</h2>
    <div class="formats-grid" aria-label="Форматы работы">
      <GlassCard
        v-for="item in data.items"
        :key="item.title"
        :glow-on-hover="true"
        :cyber-corners="true"
        padding="24px"
      >
        <h3 class="format-title">{{ item.title }}</h3>
        <p class="format-description">{{ item.description }}</p>
      </GlassCard>
    </div>
  </section>
</template>

<script setup lang="ts">
import GlassCard from './GlassCard.vue'
import type { FormatsData } from '../types'

interface Props {
  data: FormatsData
}

defineProps<Props>()
</script>

<style scoped>
.formats-block {
  margin-top: var(--grid-unit, 24px);
}

.section-label {
  font-size: var(--font-size-sm, 12px);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-mono);
  color: var(--text-tertiary, #7a8290);
  margin-bottom: 16px;
}

.block-title {
  font-size: var(--font-size-2xl, 24px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary, #e0e0e0);
  font-family: var(--font-mono);
  margin-bottom: 24px;
}

.formats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--grid-unit, 24px);
}

.format-title {
  font-size: var(--font-size-lg, 16px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary, #e0e0e0);
  font-family: var(--font-mono);
  margin-bottom: 12px;
}

.format-description {
  font-size: var(--font-size-base, 14px);
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono);
  line-height: 1.7;
  margin: 0;
}

@media (max-width: 767px) {
  .formats-grid {
    grid-template-columns: 1fr;
  }

  .block-title {
    font-size: var(--font-size-xl, 18px);
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .formats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
