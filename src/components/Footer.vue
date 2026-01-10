<template>
  <footer class="footer">
    <div class="footer-content">
      <p class="copyright">
        © {{ currentYear }} Ксения Болотова. Все права защищены.
      </p>
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
  padding: 2rem 3rem;
  border-top: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-light);
}

.footer-content {
  max-width: 900px;
  margin: 0;
  padding: 0;
  text-align: left;
}

.copyright {
  font-size: 0.875rem;
  margin: 0;
  color: var(--color-text-light);
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
  
  .copyright {
    font-size: 0.8125rem;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .footer {
    padding: 1rem;
  }
  
  .copyright {
    font-size: 0.75rem;
  }
}
</style>