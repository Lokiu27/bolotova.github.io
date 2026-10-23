<template>
  <main class="not-found-page">
    <article class="not-found-container">
      <header class="not-found-header">
        <p class="error-code" aria-hidden="true">// ERROR 404</p>
        <h1 class="page-title">Страница не найдена</h1>
      </header>

      <p class="not-found-text">
        Запрошенный адрес не существует или был перемещён.
        Проверьте ссылку или вернитесь на главную страницу.
      </p>

      <nav class="not-found-actions" aria-label="Навигация со страницы 404">
        <router-link to="/" class="action-link" aria-label="Перейти на главную страницу">
          <span class="nav-arrow" aria-hidden="true">&gt;</span>
          <span class="nav-text">/ ГЛАВНАЯ</span>
        </router-link>
        <router-link to="/projects" class="action-link" aria-label="Перейти к странице проектов">
          <span class="nav-arrow" aria-hidden="true">&gt;</span>
          <span class="nav-text">/ PET-ПРОЕКТЫ</span>
        </router-link>
      </nav>
    </article>
  </main>
</template>

<script setup lang="ts">
/**
 * NotFound - страница 404
 *
 * Отдаётся с HTTP-статусом 404 (nginx error_page → /404.html,
 * пререндер пишет её из catch-all маршрута) и закрыта от индексации
 * (robots noindex выставляет router.afterEach).
 */
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  padding: 2rem;
  background: var(--bg-void, #000);
  /* Grid background pattern 40x40px — как у остальных страниц */
  background-image:
    linear-gradient(var(--border-dim) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-dim) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: 0 0, 0 0;
  display: flex;
  align-items: center;
}

.not-found-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.not-found-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-bright, rgba(0, 240, 255, 0.3));
  position: relative;
}

.not-found-header::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100px;
  height: 2px;
  background: var(--accent-cyan, #00f0ff);
  box-shadow: 0 0 10px var(--accent-cyan-glow, rgba(0, 240, 255, 0.5));
}

.error-code {
  font-family: var(--font-mono, monospace);
  font-size: 0.875rem;
  letter-spacing: 0.15em;
  color: var(--text-dim, rgba(0, 240, 255, 0.6));
  margin: 0;
}

.page-title {
  font-family: var(--font-mono, monospace);
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent-cyan, #00f0ff);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  line-height: 1.3;
  text-shadow: 0 0 20px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

.not-found-text {
  font-family: var(--font-mono, monospace);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-primary, rgba(255, 255, 255, 0.87));
  max-width: 40rem;
  margin: 0 0 2rem;
}

.not-found-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  color: var(--text-primary, rgba(255, 255, 255, 0.87));
  text-decoration: none;
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--border-bright, rgba(0, 240, 255, 0.3));
  background: var(--bg-panel, rgba(0, 240, 255, 0.03));
  transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.action-link:hover,
.action-link:focus-visible {
  color: var(--accent-cyan, #00f0ff);
  border-color: var(--accent-cyan, #00f0ff);
  box-shadow: 0 0 12px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
  outline: none;
}

.nav-arrow {
  color: var(--accent-cyan, #00f0ff);
}

@media (max-width: 767px) {
  .not-found-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
