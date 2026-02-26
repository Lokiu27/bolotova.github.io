<template>
  <aside class="sidebar">
    <GlassPanel class="sidebar-panel">
      <header class="profile-section">
        <div class="profile-img-container">
          <LazyImage 
            :src="profileData?.profile_image || '/assets/images/profile-photo.jpg'" 
            :alt="profileData?.title || 'Profile photo'"
            class="profile-image critical-image"
          />
        </div>
        <div class="role-badge">{{ profileData?.role || 'Team Formation Expert' }}</div>
        <h1 class="profile-title glitch-hover">{{ profileData?.title?.trim() }}<br>{{ profileData?.subtitle?.trim() }}</h1>
        <p class="profile-description">{{ profileData?.description?.trim() }}</p>
      </header>
      
      <nav class="navigation-section" role="navigation" aria-label="Main navigation">
        <div class="navigation-header">// NAVIGATION</div>
        <router-link to="/" class="nav-link" exact-active-class="active" aria-label="Navigate to home page">
          <span class="nav-arrow" aria-hidden="true">></span>
          <span class="nav-text">/ ГЛАВНАЯ</span>
        </router-link>
        <router-link to="/projects" class="nav-link" active-class="active" aria-label="Navigate to projects page">
          <span class="nav-arrow" aria-hidden="true">></span>
          <span class="nav-text">/ ПРОЕКТЫ</span>
        </router-link>
        <router-link to="/resume" class="nav-link" active-class="active" aria-label="Navigate to resume page">
          <span class="nav-arrow" aria-hidden="true">></span>
          <span class="nav-text">/ РЕЗЮМЕ</span>
        </router-link>
      </nav>
      
      <div class="contacts-section" role="navigation" aria-label="Contact links">
        <a 
          v-if="contactData?.email" 
          :href="`mailto:${contactData.email}`"
          class="contact-link email"
          :aria-label="`Send email to ${contactData.email}`"
        >
          Email
        </a>
        <a 
          v-if="contactData?.telegram" 
          :href="contactData.telegram"
          target="_blank"
          rel="noopener noreferrer"
          class="contact-link telegram"
          aria-label="Open Telegram profile in new tab"
        >
          Telegram
        </a>
        <a 
          v-if="contactData?.github" 
          :href="contactData.github"
          target="_blank"
          rel="noopener noreferrer"
          class="contact-link github"
          aria-label="Open GitHub profile in new tab"
        >
          GitHub
        </a>
      </div>
      
      <template #footer>
        <StatusPanel status="online" statusText="SYSTEM: ONLINE" />
      </template>
    </GlassPanel>
  </aside>
</template>

<script setup lang="ts">
import type { HeroData, ContactsData } from '../types'
import LazyImage from './LazyImage.vue'
import GlassPanel from './GlassPanel.vue'
import StatusPanel from './StatusPanel.vue'

interface Props {
  profileData?: HeroData
  contactData?: ContactsData
}

defineProps<Props>()
</script>

<style scoped>
.sidebar {
  background-color: var(--bg-void);
  padding: var(--grid-unit);
  height: 100vh;
  width: var(--sidebar-width);
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-panel {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex-shrink: 0;
  margin-bottom: var(--grid-unit);
  padding: 40px 24px;
}

/* Cyber-style profile image container with rotating frame */
.profile-img-container {
  position: relative;
  width: 140px;
  height: 140px;
  margin-bottom: calc(var(--grid-unit) * 0.75);
}

.profile-img-container::after {
  content: '';
  position: absolute;
  top: -8px;
  left: -8px;
  right: -8px;
  bottom: -8px;
  border-radius: 50%;
  border: 1px solid var(--text-tertiary);
  border-style: dashed;
  animation: spin 20s linear infinite;
  opacity: 0.3;
  will-change: transform;
}

.profile-image {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  object-position: 50% 0%;
  border: 2px solid var(--accent-cyan);
  position: relative;
  z-index: 1;
  filter: grayscale(100%);
  transition: filter 0.3s ease;
}

.profile-image:hover {
  filter: grayscale(0%);
}

.role-badge {
  display: inline-block;
  font-size: 10px;
  padding: 4px 8px;
  border: 1px solid var(--accent-cyan);
  background: var(--accent-cyan-dim);
  color: var(--accent-cyan);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
  font-family: var(--font-mono);
}

.profile-title {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: calc(var(--grid-unit) * 0.75);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
  color: var(--text-primary);
}

.profile-description {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.6;
}

.navigation-section {
  width: 100%;
  margin: calc(var(--grid-unit) * 0.75) 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  gap: calc(var(--grid-unit) * 0.5);
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
  animation: slideFromEnd 0.3s ease;
  will-change: opacity, transform;
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

/* Focus-visible styles for keyboard navigation */
.nav-link:focus-visible {
  outline: var(--focus-outline-width) solid var(--focus-outline-color);
  outline-offset: var(--focus-outline-offset);
  box-shadow: 0 0 0 4px rgba(0, 240, 255, 0.2);
}

.contacts-section {
  width: 100%;
  margin-top: auto;
  margin-bottom: var(--grid-unit);
  display: flex;
  flex-direction: column;
  gap: calc(var(--grid-unit) * 0.5);
}

.contact-link {
  display: flex;
  align-items: center;
  gap: calc(var(--grid-unit) * 0.5);
  color: var(--text-secondary);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  padding: calc(var(--grid-unit) * 0.25) 0;
  transition: all var(--transition-fast);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.contact-link:hover {
  color: var(--accent-cyan);
  text-shadow: 0 0 8px var(--accent-cyan-glow);
}

.contact-link::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: var(--border-bright);
  border-radius: 50%;
  flex-shrink: 0;
  transition: all var(--transition-fast);
  box-shadow: 0 0 4px var(--border-bright);
}

.contact-link:hover::before {
  background-color: var(--accent-cyan);
  box-shadow: 0 0 8px var(--accent-cyan);
}

/* Focus-visible styles for contact links */
.contact-link:focus-visible {
  outline: var(--focus-outline-width) solid var(--focus-outline-color);
  outline-offset: var(--focus-outline-offset);
  color: var(--accent-cyan);
  text-shadow: 0 0 8px var(--accent-cyan-glow);
}

/* Tablet styles */
@media (max-width: 1024px) {
  .sidebar {
    padding: calc(var(--grid-unit) * 0.75);
  }
  
  .profile-img-container {
    width: 120px;
    height: 120px;
  }
  
  .profile-image {
    width: 120px;
    height: 120px;
  }
  
  .profile-title {
    font-size: var(--font-size-lg);
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    padding: var(--grid-unit);
  }
  
  .profile-img-container {
    width: 100px;
    height: 100px;
  }
  
  .profile-image {
    width: 100px;
    height: 100px;
  }
  
  .profile-title {
    font-size: var(--font-size-xl);
  }
  
  .profile-description {
    font-size: var(--font-size-xs);
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .sidebar {
    padding: calc(var(--grid-unit) * 0.75);
  }
  
  .profile-img-container {
    width: 80px;
    height: 80px;
  }
  
  .profile-image {
    width: 80px;
    height: 80px;
  }
  
  .profile-title {
    font-size: var(--font-size-lg);
  }
}

/* Уважение prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .profile-img-container::after {
    animation: none;
  }
  
  .nav-link:hover .nav-arrow {
    animation: none;
  }
}
</style>