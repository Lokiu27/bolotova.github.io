import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/css/main.css'
import { performanceMonitor } from './utils/performance'

// Import views
import Home from './views/Home.vue'
import Services from './views/Services.vue'

// Start performance monitoring
performanceMonitor.markLoadStart()

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/projects',
      name: 'Projects',
      component: Services
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when navigating to a new route
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

const app = createApp(App)
app.use(router)

// Mount app and track performance
const mountedApp = app.mount('#app')

// Mark load completion
performanceMonitor.markLoadEnd()

// Wait for next tick to ensure rendering is complete
app.config.globalProperties.$nextTick(() => {
  performanceMonitor.markRenderComplete()
  
  // Mark as interactive after a short delay to ensure all event listeners are attached
  setTimeout(() => {
    performanceMonitor.markInteractive()
    performanceMonitor.logMetrics()
  }, 100)
})