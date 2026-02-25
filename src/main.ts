import { createApp, nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/styles/tokens.css'
import './assets/styles/animations.css'
import './assets/styles/glassmorphism.css'
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

// Configure global error handlers
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err, info)
  // In production, consider sending errors to error tracking service
  // Example: errorTrackingService.captureException(err, { context: info })
}

app.config.warnHandler = (msg, instance, trace) => {
  console.warn('Vue warning:', msg, trace)
}

// Mount app and track performance
try {
  const mountedApp = app.mount('#app')

  // Mark load completion
  performanceMonitor.markLoadEnd()

  // Wait for next tick to ensure rendering is complete
  nextTick(() => {
    performanceMonitor.markRenderComplete()
    
    // Mark as interactive after a short delay to ensure all event listeners are attached
    setTimeout(() => {
      performanceMonitor.markInteractive()
      performanceMonitor.logMetrics()
    }, 100)
  })
} catch (error) {
  console.error('Failed to mount app:', error)
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : ''
  console.error('Error details:', { message: errorMessage, stack: errorStack })
  
  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 20px;"><div><h1 style="font-size: 2rem; margin-bottom: 1rem;">Application failed to load</h1><p style="font-size: 1.2rem; margin-bottom: 2rem;">Error: ${errorMessage}</p><details style="margin-bottom: 2rem; text-align: left; max-width: 600px;"><summary style="cursor: pointer; margin-bottom: 1rem;">Stack trace</summary><pre style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 4px; overflow: auto; font-size: 0.875rem;">${errorStack || 'No stack trace available'}</pre></details><button onclick="location.reload()" style="padding: 12px 24px; font-size: 1rem; background: white; color: #667eea; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Refresh Page</button></div></div>`
  }
}