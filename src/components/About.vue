<template>
  <section class="about-section">
    <div class="about-header">
      <h2 class="about-title">{{ aboutData?.title }}</h2>
      <p class="about-description">{{ aboutData?.description }}</p>
    </div>
    
    <div class="features-grid">
      <div 
        v-for="feature in aboutData?.features" 
        :key="feature.title"
        class="feature-card"
      >
        <div class="feature-icon">
          <span :class="`icon-${feature.icon}`">{{ getIconSymbol(feature.icon) }}</span>
        </div>
        <h3 class="feature-title">{{ feature.title }}</h3>
        <p class="feature-description">{{ feature.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { AboutData } from '../types'

interface Props {
  aboutData?: AboutData
}

defineProps<Props>()

const getIconSymbol = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    users: '👥',
    sparkles: '✨',
    bullseye: '🎯',
    default: '📋'
  }
  
  // Handle edge cases where iconName might be a function name or other problematic value
  if (typeof iconName !== 'string' || iconName.length === 0) {
    return iconMap.default
  }
  
  return iconMap[iconName] || iconMap.default
}
</script>

<style scoped>
.about-section {
  padding: 3rem;
  max-width: 900px;
  margin-bottom: 3rem;
}

.about-header {
  margin-bottom: 2rem;
}

.about-title {
  font-size: 1.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2rem;
  color: var(--color-text);
}

.about-description {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}

.features-grid {
  margin-top: 2rem;
}

.feature-card {
  margin-bottom: 2rem;
  background: transparent;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  text-align: left;
  transition: none;
}

.feature-card:hover {
  transform: none;
  box-shadow: none;
}

.feature-icon {
  display: none; /* Hide icons to match original Jekyll design */
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.feature-description {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-text-light);
}

/* Tablet styles */
@media (max-width: 1024px) {
  .about-section {
    padding: 2rem;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .about-section {
    padding: 1.5rem;
  }
  
  .about-title {
    font-size: 1.25rem;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .about-section {
    padding: 1rem;
  }
  
  .about-title {
    font-size: 1.125rem;
  }
}
</style>