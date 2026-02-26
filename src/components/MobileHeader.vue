<template>
  <header class="mobile-header">
    <button 
      class="hamburger-button" 
      :class="{ 'is-open': isMenuOpen }"
      @click="toggleMenu"
      aria-label="Toggle navigation menu"
      :aria-expanded="isMenuOpen"
      aria-controls="mobile-nav"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
    
    <nav 
      v-show="isMenuOpen" 
      id="mobile-nav"
      class="mobile-nav"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div class="mobile-nav-overlay" @click="closeMenu"></div>
      <div class="mobile-nav-content">
        <div class="navigation-header">// NAVIGATION</div>
        <router-link 
          to="/" 
          class="nav-link" 
          exact-active-class="active"
          aria-label="Navigate to home page"
        >
          <span class="nav-arrow" aria-hidden="true">></span>
          <span class="nav-text">/ ГЛАВНАЯ</span>
        </router-link>
        <router-link 
          to="/projects" 
          class="nav-link" 
          active-class="active"
          aria-label="Navigate to projects page"
        >
          <span class="nav-arrow" aria-hidden="true">></span>
          <span class="nav-text">/ ПРОЕКТЫ</span>
        </router-link>
        <router-link 
          to="/resume" 
          class="nav-link" 
          active-class="active"
          aria-label="Navigate to resume page"
        >
          <span class="nav-arrow" aria-hidden="true">></span>
          <span class="nav-text">/ РЕЗЮМЕ</span>
        </router-link>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const isMenuOpen = ref<boolean>(false)
const route = useRoute()

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// Close menu on route change
watch(route, () => {
  closeMenu()
})
</script>

<style scoped>
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(9, 10, 13, 0.9);
  backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--border-dim);
  padding: 12px var(--grid-unit);
  height: var(--topbar-height);
  display: flex;
  align-items: center;
}

/* Hamburger button */
.hamburger-button {
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--accent-cyan);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 8px;
  transition: all var(--transition-normal);
  position: relative;
  z-index: 1001;
}

.hamburger-button:hover {
  background: var(--accent-cyan-dim);
  box-shadow: 0 0 10px var(--accent-cyan-glow);
}

.hamburger-button:focus-visible {
  outline: var(--focus-outline-width) solid var(--focus-outline-color);
  outline-offset: var(--focus-outline-offset);
  box-shadow: 0 0 0 4px rgba(0, 240, 255, 0.2);
}

/* Hamburger lines */
.hamburger-line {
  width: 20px;
  height: 2px;
  background-color: var(--accent-cyan);
  transition: all var(--transition-normal);
  border-radius: 2px;
}

/* Animated X when open */
.hamburger-button.is-open .hamburger-line:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.hamburger-button.is-open .hamburger-line:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger-button.is-open .hamburger-line:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

/* Mobile navigation */
.mobile-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.mobile-nav-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.mobile-nav-content {
  position: absolute;
  top: var(--topbar-height);
  left: 0;
  right: 0;
  background: rgba(9, 10, 13, 0.95);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--accent-cyan);
  border-top: none;
  box-shadow: 0 0 20px var(--accent-cyan-glow);
  padding: var(--grid-unit);
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.navigation-header {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  padding: 12px;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid var(--border-dim);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.nav-arrow {
  opacity: 0;
  transform: translateX(-10px);
  transition: all var(--transition-normal);
  color: var(--accent-cyan);
  font-weight: bold;
}

.nav-text {
  transition: transform var(--transition-normal);
}

.nav-link:hover {
  color: var(--accent-cyan);
  border-color: var(--accent-cyan);
  background-color: var(--accent-cyan-dim);
  box-shadow: 0 0 10px var(--accent-cyan-glow);
}

.nav-link:hover .nav-arrow {
  opacity: 1;
  transform: translateX(0);
}

.nav-link:hover .nav-text {
  transform: translateX(4px);
}

.nav-link.active {
  color: var(--accent-cyan);
  border-color: var(--border-dim);
  background-color: var(--bg-active);
  box-shadow: 0 0 10px var(--accent-cyan-glow);
  text-shadow: 0 0 10px var(--accent-cyan-glow, rgba(0, 240, 255, 0.3));
}

.nav-link.active .nav-arrow {
  opacity: 1;
  transform: translateX(0);
}

.nav-link.active .nav-text {
  transform: translateX(4px);
}

.nav-link:focus-visible {
  outline: var(--focus-outline-width) solid var(--focus-outline-color);
  outline-offset: var(--focus-outline-offset);
  box-shadow: 0 0 0 4px rgba(0, 240, 255, 0.2);
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .mobile-nav-content {
    animation: none;
  }
  
  .hamburger-line,
  .nav-arrow,
  .nav-text {
    transition: none;
  }
}
</style>
