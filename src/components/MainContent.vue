<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CyberBreadcrumbs from './CyberBreadcrumbs.vue';
import type { BreadcrumbItem } from './CyberBreadcrumbs.vue';

/**
 * Props компонента MainContent
 */
export interface MainContentProps {
  showBreadcrumbs?: boolean;
}

const props = withDefaults(defineProps<MainContentProps>(), {
  showBreadcrumbs: true
});

const route = useRoute();

/**
 * Генерирует breadcrumbs на основе текущего маршрута
 */
const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = [
    { label: 'ROOT', path: '/' }
  ];

  // Добавляем текущий маршрут
  if (route.path !== '/') {
    const pathSegments = route.path.split('/').filter(Boolean);
    
    pathSegments.forEach((segment, index) => {
      const label = segment.toUpperCase();
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      
      items.push({
        label,
        path: index < pathSegments.length - 1 ? path : undefined
      });
    });
  } else {
    items.push({ label: 'HOME' });
  }

  return items;
});
</script>

<template>
  <div class="main-content">
    <div v-if="showBreadcrumbs" class="top-bar">
      <CyberBreadcrumbs :items="breadcrumbs" />
    </div>
    
    <div class="content-area">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.main-content {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.top-bar {
  padding: calc(var(--grid-unit) * 0.75) var(--grid-unit);
  background: rgba(14, 17, 22, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-dim);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.content-area {
  flex: 1;
  padding: var(--grid-unit);
  position: relative;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .top-bar {
    padding: calc(var(--grid-unit) * 0.5) calc(var(--grid-unit) * 0.75);
  }
  
  .content-area {
    padding: calc(var(--grid-unit) * 0.75);
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .top-bar {
    padding: calc(var(--grid-unit) * 0.5);
  }
  
  .content-area {
    padding: calc(var(--grid-unit) * 0.5);
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .top-bar {
    padding: calc(var(--grid-unit) * 0.375);
  }
  
  .content-area {
    padding: calc(var(--grid-unit) * 0.375);
  }
}

/* Fallback для браузеров без backdrop-filter */
@supports not (backdrop-filter: blur(10px)) {
  .top-bar {
    background: rgba(14, 17, 22, 0.9);
  }
}
</style>
