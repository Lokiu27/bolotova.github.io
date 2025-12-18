<template>
  <aside class="sidebar">
    <div class="profile-section">
      <LazyImage 
        :src="profileData?.profile_image || '/assets/images/profile-photo.jpg'" 
        :alt="profileData?.title || 'Profile photo'"
        class="profile-image critical-image"
      />
      <h1 class="profile-title">{{ profileData?.title }}</h1>
      <h2 class="profile-subtitle">{{ profileData?.subtitle }}</h2>
      <p class="profile-description">{{ profileData?.description }}</p>
    </div>
    
    <nav class="navigation-section">
      <router-link to="/" class="nav-link" exact-active-class="active">
        Главная
      </router-link>
      <router-link to="/projects" class="nav-link" active-class="active">
        Проекты
      </router-link>
    </nav>
    
    <div class="contacts-section">
      <a 
        v-if="contactData?.email" 
        :href="`mailto:${contactData.email}`"
        class="contact-link email"
      >
        Email
      </a>
      <a 
        v-if="contactData?.telegram" 
        :href="contactData.telegram"
        target="_blank"
        rel="noopener noreferrer"
        class="contact-link telegram"
      >
        Telegram
      </a>
      <a 
        v-if="contactData?.github" 
        :href="contactData.github"
        target="_blank"
        rel="noopener noreferrer"
        class="contact-link github"
      >
        GitHub
      </a>
      <a 
        v-if="contactData?.resume" 
        :href="contactData.resume"
        target="_blank"
        rel="noopener noreferrer"
        class="contact-link resume"
      >
        Resume
      </a>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { HeroData, ContactsData } from '../types'
import LazyImage from './LazyImage.vue'

interface Props {
  profileData?: HeroData
  contactData?: ContactsData
}

defineProps<Props>()
</script>

<style scoped>
.sidebar {
  background-color: var(--color-sidebar-bg);
  padding: 3rem 2rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex-shrink: 0;
}

.profile-image {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--color-accent);
  margin-bottom: 2rem;
}

.profile-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
  color: var(--color-text);
}

.profile-subtitle {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
  position: relative;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.profile-subtitle::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 4px;
  background-color: var(--color-accent);
}

.profile-description {
  font-size: 0.875rem;
  color: var(--color-text-light);
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.6;
}

.navigation-section {
  width: 100%;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: block;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9375rem;
  padding: 0.75rem 1rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  border-radius: 4px;
}

.nav-link:hover {
  color: var(--color-link-hover);
  border-color: var(--color-accent);
}

.nav-link.active {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background-color: rgba(255, 255, 255, 0.05);
}

.contacts-section {
  width: 100%;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9375rem;
  padding: 0.25rem 0;
  transition: color 0.2s ease;
}

.contact-link:hover {
  color: var(--color-link-hover);
}

.contact-link::before {
  content: '';
  width: 18px;
  height: 18px;
  background-color: var(--color-text);
  border-radius: 50%;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.contact-link:hover::before {
  background-color: var(--color-link-hover);
}

/* Tablet styles */
@media (max-width: 1024px) {
  .sidebar {
    padding: 2rem 1.5rem;
  }
  
  .profile-image {
    width: 140px;
    height: 140px;
  }
  
  .profile-title,
  .profile-subtitle {
    font-size: 1.35rem;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    padding: 2rem;
  }
  
  .profile-image {
    width: 120px;
    height: 120px;
  }
  
  .profile-title,
  .profile-subtitle {
    font-size: 1.5rem;
  }
  
  .profile-description {
    font-size: 0.8125rem;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .sidebar {
    padding: 1.5rem;
  }
  
  .profile-image {
    width: 100px;
    height: 100px;
  }
  
  .profile-title,
  .profile-subtitle {
    font-size: 1.25rem;
  }
}
</style>