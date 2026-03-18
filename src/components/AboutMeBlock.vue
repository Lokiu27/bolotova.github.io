<template>
  <section class="about-me-block" aria-labelledby="about-me-heading">
    <div class="section-label">{{ data.label }}</div>
    <h2 id="about-me-heading" class="block-role">{{ data.role }}</h2>
    <ul class="specializations-list" aria-label="Направления специализации">
      <li
        v-for="(spec, index) in data.specializations"
        :key="index"
        class="specialization-item"
      >
        <span class="item-marker" aria-hidden="true">&gt;</span>
        {{ spec }}
      </li>
    </ul>
    <p class="block-summary">{{ data.summary }}</p>
  </section>
</template>

<script setup lang="ts">
import type { AboutMeData } from '../types'

interface Props {
  data: AboutMeData
}

defineProps<Props>()
</script>

<style scoped>
.about-me-block {
  background: rgba(14, 17, 22, 0.1);
  backdrop-filter: blur(var(--glass-blur, 10px));
  border: 1px solid rgba(61, 68, 80, 0.2);
  border-radius: var(--radius-md, 4px);
  padding: var(--grid-unit, 24px);
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

.block-role {
  font-size: var(--font-size-xl, 18px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary, #e0e0e0);
  font-family: var(--font-mono);
  margin-bottom: 20px;
}

.specializations-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.specialization-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: var(--font-size-base, 14px);
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono);
  line-height: 1.6;
}

.item-marker {
  color: var(--accent-cyan, #00f0ff);
  flex-shrink: 0;
  font-weight: 700;
}

.block-summary {
  font-size: var(--font-size-base, 14px);
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono);
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 767px) {
  .about-me-block {
    padding: calc(var(--grid-unit, 16px) * 1.5);
  }

  .block-role {
    font-size: var(--font-size-lg, 16px);
  }
}
</style>
