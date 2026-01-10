<template>
  <div class="projects-view">
    <section class="projects-section">
      <div class="projects-header">
        <h2 class="projects-title">Мои проекты</h2>
        <p class="projects-description">
         Мои вайб-кодинг пет-проекты.
        </p>
      </div>
      
      <div class="projects-grid">
        <div class="project-card">
          <h3 class="project-title">Мини llm в браузере</h3>
          <p class="project-description">
            Не знаю, еще не придумала.
          </p>
        </div>
        
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// No props needed for this static content view
</script>

<style scoped>
.projects-view {
  flex: 1;
}

.projects-section {
  padding: 3rem;
  max-width: 900px;
  margin-bottom: 3rem;
}

.projects-header {
  margin-bottom: 3rem;
}

.projects-title {
  font-size: 1.5rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2rem;
  color: var(--color-text);
}

.projects-description {
  font-size: 1rem;
  line-height: 1.8;
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}

.projects-grid {
  display: grid;
  gap: 2rem;
}

.project-card {
  margin-bottom: 2rem;
  background: transparent;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
  text-align: left;
}

.project-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.project-description {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-text-light);
}

/* Tablet styles */
@media (max-width: 1024px) {
  .projects-section {
    padding: 2rem;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .projects-section {
    padding: 1.5rem;
  }
  
  .projects-title {
    font-size: 1.25rem;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .projects-section {
    padding: 1rem;
  }
  
  .projects-title {
    font-size: 1.125rem;
  }
}
</style>