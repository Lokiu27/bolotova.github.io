<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-left">
        <p class="copyright">
          © {{ currentYear }} Ксения Болотова. Все права защищены.
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

const currentYear = computed(() => new Date().getFullYear())
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