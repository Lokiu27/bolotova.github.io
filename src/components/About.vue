<template>
  <main class="about-section" aria-labelledby="about-heading">
    <!-- Hero section with mission statement label -->
    <section class="about-header hero-section">
      <div class="section-label mission-label">[ MISSION STATEMENT ]</div>
      <h2 id="about-heading" class="about-title tagline glitch-hover">
        <template v-if="aboutData?.title">
          {{ aboutData.title }}
        </template>
        <template v-else>
          ПОМОГУ СОЗДАТЬ <span class="tagline-highlight">ЭФФЕКТИВНУЮ КОМАНДУ</span> БИЗНЕС-АНАЛИТИКОВ И ВНЕДРЯТЬ СОВРЕМЕННЫЕ ТЕХНОЛОГИИ.
        </template>
      </h2>
      <p class="tagline-highlight about-description">
        {{ aboutData?.description || '>> ФАНАТ AI ИНСТРУМЕНТОВ.' }}
      </p>
    </section>
    
    <!-- Features section with label -->
    <section class="features-section" aria-labelledby="features-heading">
      <h2 id="features-heading" class="visually-hidden">Features</h2>
      <div class="section-label features-label">// О МОЕЙ РАБОТЕ_</div>
      <div class="features-grid" aria-label="Features">
        <article 
          v-for="(feature, index) in aboutData?.features" 
          :key="feature.title"
          class="glass-card feature-card cyber-corners glow-on-hover"
        >
          <header class="card-header">
            <div class="card-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="feature-icon" role="img" :aria-label="`${feature.icon} icon`">
              <svg v-if="feature.icon === 'users'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <svg v-else-if="feature.icon === 'sparkles'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                <rect x="2" y="3" width="8" height="8"></rect>
                <polygon points="22 22 17 22 17 17 22 17 22 22"></polygon>
                <rect x="14" y="3" width="8" height="8"></rect>
                <path d="M2 17h8v5H2z"></path>
              </svg>
              <svg v-else-if="feature.icon === 'bullseye'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </div>
          </header>
          <h3 class="feature-title glitch-hover">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { AboutData } from '../types'

interface Props {
  aboutData?: AboutData
}

defineProps<Props>()
</script>

<style scoped>
.about-section {
  padding: 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Section label base styles */
.section-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-mono, 'JetBrains Mono', 'Courier New', monospace);
  margin-bottom: 16px;
}

/* Mission statement label - cyan color */
.mission-label {
  color: var(--accent-cyan, #00f0ff);
}

/* Features section label - tertiary color */
.features-label {
  color: var(--text-tertiary, #4a505c);
  margin-top: 48px;
  padding-bottom: 24px;
}

/* Visually hidden but accessible to screen readers */
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

/* Hero section with tagline and highlight */
.about-header,
.hero-section {
  margin-bottom: 3rem;
  text-align: left;
}

.about-title,
.tagline {
  font-size: var(--font-size-3xl, 32px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  color: var(--text-primary, #e0e0e0);
  font-family: var(--font-mono, 'JetBrains Mono', 'Courier New', monospace);
  line-height: 1.4;
  max-width: 800px;
}

.tagline-highlight {
  color: var(--accent-cyan, #00f0ff);
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.about-description {
  font-size: 0.8em;
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono, 'JetBrains Mono', 'Courier New', monospace);
  display: inline;
}

/* Features grid with auto-fit */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--grid-unit, 24px);
  margin-top: 2rem;
}

.feature-card {
  position: relative;
  background: rgba(14, 17, 22, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(61, 68, 80, 0.2);
  border-radius: var(--radius-md, 4px);
  padding: 32px;
  transition: all var(--transition-normal, 0.3s ease);
  overflow: hidden;
  contain: layout style paint;
  min-height: 280px;
}

.feature-card.glow-on-hover:hover {
  border-color: var(--accent-cyan, #00f0ff);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.3);
  transform: translateY(-2px);
  will-change: transform, box-shadow;
}

/* Cyber corners */
.feature-card.cyber-corners::before,
.feature-card.cyber-corners::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid var(--accent-cyan, #00f0ff);
  opacity: 0;
  transition: opacity var(--transition-normal, 0.3s ease);
  pointer-events: none;
}

.feature-card.cyber-corners::before {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.feature-card.cyber-corners::after {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

.feature-card.cyber-corners:hover::before,
.feature-card.cyber-corners:hover::after {
  opacity: 1;
}

/* Card header with flexbox layout */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-dim, #232730);
}

/* Card index - positioned on the left */
.card-index {
  font-size: 32px;
  font-weight: 700;
  color: var(--border-bright, #3d4450);
  font-family: var(--font-mono, 'JetBrains Mono', 'Courier New', monospace);
  line-height: 1;
}

/* Card icon - positioned on the right */
.feature-icon {
  font-size: 24px;
  color: var(--accent-cyan, #00f0ff);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.feature-icon svg {
  filter: drop-shadow(0 0 8px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3)));
  stroke: var(--accent-cyan, #00f0ff);
}

.feature-title {
  font-size: var(--font-size-xl, 18px);
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-mono, 'JetBrains Mono', 'Courier New', monospace);
}

.feature-description {
  font-size: var(--font-size-base, 14px);
  line-height: 1.7;
  color: var(--text-secondary, #858b99);
  font-family: var(--font-mono, 'JetBrains Mono', 'Courier New', monospace);
}

/* Tablet styles */
@media (max-width: 1024px) {
  .about-section {
    padding: 2rem;
  }
  
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .about-section {
    padding: 1.5rem;
  }
  
  .tagline {
    font-size: var(--font-size-2xl, 24px);
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .about-section {
    padding: 1rem;
  }
  
  .tagline {
    font-size: var(--font-size-xl, 18px);
  }
  
  .feature-icon {
    font-size: 20px;
  }
  
  .card-index {
    font-size: 24px;
  }
}
</style>