<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

/**
 * Интерфейс элемента breadcrumb
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
}

/**
 * Props компонента CyberBreadcrumbs
 */
export interface CyberBreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: string;
}

const props = withDefaults(defineProps<CyberBreadcrumbsProps>(), {
  separator: '/'
});

/**
 * Проверяет, является ли элемент последним в списке
 */
const isLastItem = (index: number) => index === props.items.length - 1;
</script>

<template>
  <nav class="cyber-breadcrumbs" aria-label="Breadcrumb navigation">
    <ol class="breadcrumb-list">
      <li 
        v-for="(item, index) in items" 
        :key="index"
        class="breadcrumb-item"
        :class="{ 'breadcrumb-item--active': isLastItem(index) }"
      >
        <RouterLink 
          v-if="item.path && !isLastItem(index)"
          :to="item.path"
          class="breadcrumb-link"
        >
          {{ item.label }}
        </RouterLink>
        <span v-else class="breadcrumb-text">
          {{ item.label }}
        </span>
        <span 
          v-if="!isLastItem(index)" 
          class="breadcrumb-separator"
          aria-hidden="true"
        >
          {{ separator }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.cyber-breadcrumbs {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
}

.breadcrumb-link {
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.breadcrumb-link:hover {
  color: var(--accent-cyan);
}

.breadcrumb-link:focus-visible {
  outline: 2px solid var(--accent-cyan);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.breadcrumb-text {
  color: var(--text-tertiary);
}

.breadcrumb-item--active .breadcrumb-text {
  color: var(--accent-cyan);
  font-weight: 600;
}

.breadcrumb-separator {
  color: var(--text-tertiary);
  opacity: 0.5;
  user-select: none;
}
</style>
