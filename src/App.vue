<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import Sidebar from './components/Sidebar.vue'
import MobileHeader from './components/MobileHeader.vue'
import Footer from './components/Footer.vue'
import WebGLBackground from './components/WebGLBackground.vue'
import ScanlineOverlay from './components/ScanlineOverlay.vue'
import type { HeroData, AboutData, ContactsData } from './types'
import { heroDataKey, aboutDataKey, contactsDataKey } from './types/injection-keys'
import { validateHeroData, validateAboutData, validateContactsData } from './schemas/data-schemas'
import { ZodError } from 'zod'
import { useSchemaOrg } from './composables/useSchemaOrg'
import { BASE_URL } from './config/seo'

const heroData = ref<HeroData>()
const aboutData = ref<AboutData>()
const contactsData = ref<ContactsData>()
const loading = ref(true)
const error = ref<string>()

// Provide data to child components with typed keys
provide(heroDataKey, heroData)
provide(aboutDataKey, aboutData)
provide(contactsDataKey, contactsData)

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

    // Parse JSON and validate with Zod schemas
    const heroJson = await heroResponse.json()
    const aboutJson = await aboutResponse.json()
    const contactsJson = await contactsResponse.json()

    // Validate data before assigning
    heroData.value = validateHeroData(heroJson)
    aboutData.value = validateAboutData(aboutJson)
    contactsData.value = validateContactsData(contactsJson)

    // Inject Schema.org structured data after loading JSON data
    const { injectSchemas } = useSchemaOrg()
    injectSchemas({
      person: {
        name: 'Болотова Ксения',
        jobTitle: heroData.value.subtitle,
        description: heroData.value.description,
        email: contactsData.value.email,
        url: BASE_URL,
        sameAs: [
          contactsData.value.telegram,
          contactsData.value.github
        ]
      },
      website: {
        name: 'Болотова Ксения — Персональный сайт',
        url: BASE_URL
      },
      professionalService: {
        name: 'Консультации по бизнес-анализу и AI инструментам',
        description: aboutData.value.title,
        url: BASE_URL,
        serviceTypes: aboutData.value.features.map(f => f.title)
      }
    })
  } catch (err) {
    if (err instanceof ZodError) {
      // Handle validation errors with user-friendly messages
      const validationErrors = err.errors?.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') || 'Validation failed'
      error.value = `Invalid data format: ${validationErrors}`
    } else if (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as any).errors)) {
      // Handle ZodError-like objects that might not be instanceof ZodError
      const validationErrors = (err as any).errors.map((e: any) => `${e.path?.join('.') || 'unknown'}: ${e.message}`).join(', ')
      error.value = `Invalid data format: ${validationErrors}`
    } else {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
    }
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
    <!-- Skip to main content link for accessibility -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    
    <!-- WebGL Background Layer (z-index: 0) -->
    <WebGLBackground :enabled="true" />
    
    <!-- Scanline Overlay Layer (z-index: 9999) -->
    <ScanlineOverlay :enabled="true" />
    
    <div v-if="loading" class="loading" role="status" aria-live="polite">
      Загрузка...
    </div>
    
    <div v-else-if="error" class="error" role="alert" aria-live="assertive">
      Ошибка загрузки: {{ error }}
    </div>
    
    <div v-show="!loading && !error" class="app-layout">
      <MobileHeader class="mobile-header" />
      
      <Sidebar 
        :profile-data="heroData" 
        :contact-data="contactsData"
        class="app-sidebar"
      />
      
      <main id="main-content" class="app-main" role="main">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component 
              :is="Component"
              :hero-data="heroData"
              :about-data="aboutData"
              :contact-data="contactsData"
            />
          </transition>
        </router-view>
        <Footer />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  font-family: var(--font-mono);
  background-color: var(--bg-void);
  color: var(--text-primary);
  position: relative;
}

/* Skip link for accessibility */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--accent-cyan);
  color: var(--bg-void);
  padding: 8px 16px;
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  z-index: 10000;
  transition: top var(--transition-fast);
}

.skip-link:focus {
  top: 0;
}

.loading, .error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-size: var(--font-size-xl);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 10;
}

.error {
  color: #dc3545;
}

.app-layout {
  position: relative;
  min-height: 100vh;
  z-index: 1;
}

.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  z-index: 100;
  overflow-y: auto;
}

.mobile-header {
  display: none;
}

.app-main {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  /* Grid background pattern 40x40px */
  background-image: 
    linear-gradient(var(--border-dim) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-dim) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: 0 0, 0 0;
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
@media (max-width: 767px) {
  .app-layout {
    display: flex;
    flex-direction: column;
  }
  
  .app-sidebar {
    display: none;
  }
  
  .mobile-header {
    display: block;
  }
  
  .app-main {
    margin-left: 0;
    padding-top: var(--topbar-height);
  }
}

/* Page transition animations */
.page-enter-active,
.page-leave-active {
  transition: all var(--transition-normal);
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
    font-size: var(--font-size-sm);
  }
}
</style>
