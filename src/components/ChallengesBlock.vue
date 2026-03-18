<template>
  <section class="challenges-block" aria-labelledby="challenges-heading">
    <div class="section-label">{{ data.label }}</div>
    <h2 id="challenges-heading" class="block-title">{{ data.title }}</h2>
    <p v-if="data.intro && data.intro.trim()" class="block-intro">{{ data.intro }}</p>
    <ul class="challenges-list" aria-label="Список задач">
      <li
        v-for="(item, index) in data.items"
        :key="index"
        class="challenges-item"
      >
        <span class="item-marker" aria-hidden="true">&gt;</span>
        {{ item }}
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { ChallengesData } from '../types'

interface Props {
  data: ChallengesData
}

defineProps<Props>()
</script>

<style scoped>
.challenges-block {
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

.block-title {
  font-size: var(--font-size-lg, 18px);
  font-weight: 700;
  color: var(--text-primary, #e0e0e0);
  font-family: var(--font-mono);
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.block-intro {
  font-size: var(--font-size-base, 14px);
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono);
  margin-bottom: 20px;
  line-height: 1.6;
}

.challenges-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.challenges-item {
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

@media (max-width: 767px) {
  .challenges-block {
    padding: calc(var(--grid-unit, 16px) * 1.5);
  }
}
</style>
