<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Footer from './components/Footer.vue'
import type { HeroData, AboutData, ContactsData } from './types'

const heroData = ref<HeroData>()
const aboutData = ref<AboutData>()
const contactsData = ref<ContactsData>()
const loading = ref(true)
const error = ref<string>()

// Provide data to child components
provide('heroData', heroData)
provide('aboutData', aboutData)
provide('contactsData', contactsData)

const loadData = async () => {
  try {
    const [heroResponse, aboutResponse, contactsResponse] = await Promise.all([
      fetch('/data/hero.json'),
      fetch('/data/about.json'),
      fetch('/data/contacts.json')
    ])

    if (!heroResponse.ok || !aboutResponse.ok || !contactsResponse.ok) {
      throw new Error('Failed to load data')
    }

    heroData.value = await heroResponse.json()
    aboutData.value = await aboutResponse.json()
    contactsData.value = await contactsResponse.json()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="app">
    <div v-if="loading" class="loading">
      Загрузка...
    </div>
    
    <div v-else-if="error" class="error">
      Ошибка загрузки: {{ error }}
    </div>
    
    <div v-else class="app-layout">
      <Sidebar 
        :profile-data="heroData" 
        :contact-data="contactsData"
        class="app-sidebar"
      />
      
      <main class="app-main">
        <transition name="page" mode="out-in">
          <router-view 
            :hero-data="heroData"
            :about-data="aboutData"
            :contact-data="contactsData"
          />
        </transition>
        <Footer />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-text);
}

.loading, .error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-size: 1.2rem;
}

.error {
  color: #dc3545;
}

.app-layout {
  position: relative;
  min-height: 100vh;
}

.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 330px;
  height: 100vh;
  z-index: 100;
  overflow-y: auto;
}

.app-main {
  margin-left: 330px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Tablet styles */
@media (max-width: 1024px) {
  .app-sidebar {
    width: 280px;
  }
  
  .app-main {
    margin-left: 280px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .app-layout {
    display: flex;
    flex-direction: column;
  }
  
  .app-sidebar {
    position: static;
    width: 100%;
    height: auto;
  }
  
  .app-main {
    margin-left: 0;
  }
}

/* Page transition animations */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.page-enter-to,
.page-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Small mobile styles */
@media (max-width: 480px) {
  .app {
    font-size: 14px;
  }
}
</style>
