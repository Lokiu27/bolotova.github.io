<template>
  <div class="projects-view">
    <section class="projects-section" aria-labelledby="projects-heading">
      <!-- Hero section -->
      <header class="hero-section">
        <h2 id="projects-heading" class="tagline glitch-hover">Мои проекты</h2>
        <p class="tagline-highlight">
          Мои вайб-кодинг пет-проекты.
        </p>
      </header>
      
      <!-- Projects grid with GlassCard -->
      <div class="projects-grid" role="list" aria-label="Projects">
        <GlassCard 
          class="project-card"
          :padding="'24px'"
          role="listitem"
        >
          <div class="card-index" aria-hidden="true">01</div>
          <h3 class="project-title glitch-hover">Мини llm в браузере</h3>
          <p class="project-description">
            Не знаю, еще не придумала.
          </p>
        </GlassCard>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import GlassCard from '../components/GlassCard.vue'
</script>

<style scoped>
.projects-view {
  flex: 1;
}

.projects-section {
  padding: 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Hero section */
.hero-section {
  margin-bottom: 3rem;
  text-align: left;
}

.tagline {
  font-size: var(--font-size-3xl, 32px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  color: var(--text-primary, #e0e0e0);
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.tagline-highlight {
  font-size: var(--font-size-lg, 16px);
  line-height: 1.8;
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  text-shadow: 0 0 10px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

/* Projects grid with auto-fit */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--grid-unit, 24px);
}

.project-card {
  position: relative;
}

/* Card index - cyberpunk style */
.card-index {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: var(--font-size-2xl, 24px);
  font-weight: 700;
  color: var(--accent-cyan, #00f0ff);
  opacity: 0.3;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.project-title {
  font-size: var(--font-size-xl, 18px);
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

.project-description {
  font-size: var(--font-size-base, 14px);
  line-height: 1.7;
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
}

/* Tablet styles */
@media (max-width: 1024px) {
  .projects-section {
    padding: 2rem;
  }
  
  .projects-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .projects-section {
    padding: 1.5rem;
  }
  
  .tagline {
    font-size: var(--font-size-2xl, 24px);
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .projects-section {
    padding: 1rem;
  }
  
  .tagline {
    font-size: var(--font-size-xl, 18px);
  }
}
</style>