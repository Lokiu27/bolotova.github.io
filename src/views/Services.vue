<template>
  <div class="projects-view">
    <section class="projects-section">
      <div class="projects-header">
        <h2 class="projects-title">Мои проекты</h2>
        <p class="projects-description">
          Примеры успешных проектов по формированию команд бизнес-аналитиков и внедрению современных технологий.
        </p>
      </div>
      
      <div class="projects-grid">
        <div class="project-card">
          <h3 class="project-title">Формирование команды аналитиков для FinTech стартапа</h3>
          <p class="project-description">
            Создание команды из 8 бизнес-аналитиков для финтех компании. Внедрение современных методологий анализа и AI инструментов для обработки финансовых данных.
          </p>
        </div>
        
        <div class="project-card">
          <h3 class="project-title">Внедрение AI инструментов в крупной IT компании</h3>
          <p class="project-description">
            Интеграция ChatGPT, Claude и других AI решений в рабочие процессы команды из 15 аналитиков. Повышение эффективности на 40%.
          </p>
        </div>
        
        <div class="project-card">
          <h3 class="project-title">Оптимизация процессов анализа в e-commerce</h3>
          <p class="project-description">
            Реструктуризация процессов бизнес-анализа для интернет-магазина. Сокращение времени подготовки отчетов в 3 раза.
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