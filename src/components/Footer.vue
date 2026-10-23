<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-left">
        <p class="copyright">
          Болотова Ксения Борисовна — физическое лицо, применяющее специальный налоговый режим «Налог на профессиональный доход».

          ИНН 505202666269

          Место нахождения: Москва.

          По вопросам обработки персональных данных и прочим вопросам: k.bolotova@yandex.ru.

          <RouterLink to="/privacy" class="footer-link">Политика обработки персональных данных </RouterLink>

          <button type="button" class="footer-link cookie-settings" @click="reopenConsent">Настройки cookies</button>

          © {{ currentYear }} Болотова Ксения. Все права защищены.
        </p>
      </div>
      <div class="footer-right">
        <p class="connection-status">SECURE CONNECTION ESTABLISHED</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCookieConsent } from '../composables/useCookieConsent'
import { clearYandexMetricaCookies } from '../composables/useYandexMetrica'

const currentYear = computed(() => new Date().getFullYear())
const { consent, resetConsent } = useCookieConsent()

// Отзыв согласия: сбросить решение и показать баннер снова.
// Если Метрика уже была загружена, выгрузить её нельзя — перезагружаем
// страницу, чтобы tag.js не продолжил работу
const reopenConsent = (): void => {
  const wasGranted = consent.value === 'granted'
  resetConsent()
  clearYandexMetricaCookies()
  if (wasGranted) {
    window.location.reload()
  }
}
</script>

<style scoped>
.footer {
  margin-top: 3rem;
  padding: 40px 24px;
  border-top: 1px solid var(--border-dim);
  background: transparent;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 100%;
}

.copyright,
.connection-status {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin: 0;
}

.footer-link {
  color: var(--text-secondary);
  transition: color 0.2s ease;
}

.footer-link:hover,
.footer-link:focus-visible {
  color: var(--accent-cyan);
}

/* Кнопка «Настройки cookies» выглядит как ссылка футера */
.cookie-settings {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .footer {
    padding: 2rem;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .footer {
    padding: 1.5rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .footer {
    padding: 1rem;
  }
}
</style>