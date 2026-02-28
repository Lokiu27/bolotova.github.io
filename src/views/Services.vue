<template>
  <main class="projects-page">
    <article class="projects-container">
      <header class="projects-header">
        <h1 class="page-title">Мои проекты</h1>
      </header>
      
      <p class="page-description">
        Мои вайб-кодинг пет-проекты.
      </p>
      
      <!-- Projects grid with GlassCard -->
      <div class="projects-grid" role="list" aria-label="Projects">
        <RouterLink 
          to="/projects/mini-llm" 
          class="project-link"
          aria-label="Открыть проект Мини LLM в браузере"
        >
          <GlassCard 
            class="project-card"
            :padding="'24px'"
            role="listitem"
          >
            <div class="card-index" aria-hidden="true">01</div>
            <h3 class="project-title glitch-hover">Мини LLM в браузере</h3>
            <p class="project-description">
              Генерация JSON Schema с использованием языковой модели Phi-3-mini, работающей полностью в браузере.
            </p>
          </GlassCard>
        </RouterLink>
      </div>
    </article>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import GlassCard from '../components/GlassCard.vue'
</script>

<style scoped>
.projects-page {
  min-height: 100vh;
  padding: 2rem;
  background: var(--bg-void, #000);
  /* Grid background pattern 40x40px */
  background-image: 
    linear-gradient(var(--border-dim) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-dim) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: 0 0, 0 0;
}

.projects-container {
  max-width: 1200px;
  margin: 0 auto;
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-bright, rgba(0, 240, 255, 0.3));
  position: relative;
}

.projects-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100px;
  height: 2px;
  background: var(--accent-cyan, #00f0ff);
  box-shadow: 0 0 10px var(--accent-cyan-glow, rgba(0, 240, 255, 0.5));
}

.page-title {
  font-family: var(--font-mono, monospace);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent-cyan, #00f0ff);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

.page-description {
  font-size: var(--font-size-lg, 16px);
  line-height: 1.8;
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  margin-bottom: 2rem;
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

/* Project link styling */
.project-link {
  text-decoration: none;
  display: block;
  transition: transform 0.3s ease;
}

.project-link:hover {
  transform: translateY(-4px);
}

.project-link:hover .project-card {
  border-color: var(--accent-cyan, #00f0ff);
  box-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

.project-link:focus {
  outline: none;
}

.project-link:focus-visible .project-card {
  outline: 2px solid var(--accent-cyan, #00f0ff);
  outline-offset: 4px;
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

/* Responsive design */
@media (max-width: 768px) {
  .projects-page {
    padding: 1rem;
  }
  
  .projects-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Tablet breakpoint */
@media (min-width: 769px) and (max-width: 1024px) {
  .projects-page {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .projects-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem;
  }
}
</style>