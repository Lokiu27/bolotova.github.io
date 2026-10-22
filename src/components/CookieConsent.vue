<script setup lang="ts">
import { useCookieConsent } from '../composables/useCookieConsent'

const { consent, grantConsent, denyConsent } = useCookieConsent()
</script>

<template>
  <transition name="consent">
    <div
      v-if="consent === null"
      class="cookie-consent"
      role="region"
      aria-label="Согласие на использование файлов cookie"
    >
      <p class="consent-text">
        Мы используем сервис Яндекс Метрика (файлы cookie) для анализа посещаемости сайта.
        Подробнее — в
        <RouterLink to="/privacy" class="consent-link">Политике обработки персональных данных</RouterLink>.
      </p>
      <div class="consent-actions">
        <button type="button" class="consent-btn consent-accept" @click="grantConsent">Принять</button>
        <button type="button" class="consent-btn consent-deny" @click="denyConsent">Отклонить</button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.cookie-consent {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  /* Выше ScanlineOverlay (9999), ниже skip-link не конфликтует — он сверху экрана */
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--grid-unit);
  padding: 16px clamp(16px, 4vw, 40px);
  background: rgba(14, 17, 22, 0.9);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-top: 1px solid var(--border-bright);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.6);
  font-family: var(--font-mono);
}

.consent-text {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 640px;
}

.consent-link {
  color: var(--accent-cyan);
  text-decoration: none;
  border-bottom: 1px dotted var(--accent-cyan);
  transition: border-color var(--transition-fast);
}

.consent-link:hover,
.consent-link:focus-visible {
  border-bottom-style: solid;
}

.consent-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

/* Кнопки равнозначны по размеру и заметности — отказ не сложнее согласия */
.consent-btn {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.consent-accept {
  background: var(--accent-cyan);
  border: 1px solid var(--accent-cyan);
  color: var(--bg-void);
}

.consent-accept:hover {
  box-shadow: 0 0 20px var(--accent-cyan-glow);
}

.consent-deny {
  background: transparent;
  border: 1px solid var(--border-bright);
  color: var(--text-primary);
}

.consent-deny:hover {
  border-color: var(--text-secondary);
}

/* Появление снизу вверх */
.consent-enter-active {
  transition: transform var(--transition-normal), opacity var(--transition-normal);
}

.consent-enter-from,
.consent-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.consent-leave-active {
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

@media (prefers-reduced-motion: reduce) {
  .consent-enter-active,
  .consent-leave-active {
    transition: none;
  }
}

/* Mobile: текст над кнопками */
@media (max-width: 767px) {
  .cookie-consent {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
  }

  .consent-text {
    max-width: none;
  }

  .consent-actions {
    justify-content: center;
  }
}
</style>
