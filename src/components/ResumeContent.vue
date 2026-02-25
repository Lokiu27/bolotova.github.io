<template>
  <article class="resume-content" v-html="htmlContent"></article>
</template>

<script setup lang="ts">
/**
 * ResumeContent Component
 * 
 * Renders sanitized HTML content from parsed markdown resume.
 * Applies resume-specific styling and ensures proper semantic structure.
 * 
 * Requirements: 1.3, 1.4, 1.5
 */

interface Props {
  htmlContent: string  // Sanitized HTML from markdown parser
}

defineProps<Props>()
</script>

<style scoped>
/* Resume Content Container - Glassmorphism Theme */
.resume-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2.5rem;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 240, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 240, 255, 0.1);
  line-height: 1.7;
  position: relative;
  color: #e0e0e0;
}

/* Cyberpunk accent glow effect */
.resume-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    #00f0ff 50%, 
    transparent 100%);
  border-radius: 12px 12px 0 0;
  opacity: 0.8;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

/* Heading styles with proper hierarchy */
.resume-content :deep(h1) {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: #00f0ff;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
}

.resume-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1.25rem;
  color: #00f0ff;
  border-bottom: 2px solid rgba(0, 240, 255, 0.3);
  padding-bottom: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
}

.resume-content :deep(h2::after) {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: #00f0ff;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.resume-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.75rem;
  margin-bottom: 0.875rem;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.resume-content :deep(h4) {
  font-size: 1.1rem;
  font-weight: 500;
  margin-top: 1.25rem;
  margin-bottom: 0.625rem;
  color: #b0b0b0;
}

/* Paragraph and text styles */
.resume-content :deep(p) {
  margin-bottom: 1.125rem;
  color: #e0e0e0;
  font-size: 1rem;
}

.resume-content :deep(strong) {
  font-weight: 600;
  color: #ffffff;
}

.resume-content :deep(em) {
  color: #b0b0b0;
}

/* List styles */
.resume-content :deep(ul),
.resume-content :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.75rem;
}

.resume-content :deep(ul) {
  list-style-type: none;
}

.resume-content :deep(ul li) {
  position: relative;
  padding-left: 0.5rem;
  color: #e0e0e0;
}

.resume-content :deep(ul li::before) {
  content: '▹';
  position: absolute;
  left: -1.25rem;
  color: #00f0ff;
  font-weight: bold;
}

.resume-content :deep(ol) {
  list-style-type: decimal;
}

.resume-content :deep(li) {
  margin-bottom: 0.625rem;
  color: #e0e0e0;
  line-height: 1.6;
}

/* Link styles with cyberpunk accent */
.resume-content :deep(a) {
  color: #00f0ff;
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
  font-weight: 500;
}

.resume-content :deep(a:hover) {
  color: #5dfdff;
  text-shadow: 0 0 10px rgba(0, 240, 255, 0.5);
}

.resume-content :deep(a::after) {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: #00f0ff;
  transition: width 0.3s ease;
  box-shadow: 0 0 5px rgba(0, 240, 255, 0.5);
}

.resume-content :deep(a:hover::after) {
  width: 100%;
}

/* Contact information section */
.resume-content :deep(.resume-contact) {
  margin-bottom: 2rem;
  padding: 1.25rem;
  background: rgba(135, 206, 235, 0.05);
  border-radius: 8px;
  border-left: 3px solid var(--color-accent, #87CEEB);
}

.resume-content :deep(.contact-phone),
.resume-content :deep(.contact-email) {
  margin-bottom: 0.625rem;
  font-size: 1rem;
}

/* Resume intro section */
.resume-content :deep(.resume-intro) {
  margin-bottom: 2.5rem;
}

.resume-content :deep(.resume-title) {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--color-text);
}

.resume-content :deep(.resume-summary) {
  font-size: 1.0625rem;
  line-height: 1.7;
  margin-bottom: 1.25rem;
}

.resume-content :deep(.resume-highlights) {
  margin-top: 1rem;
}

/* Section styles */
.resume-content :deep(section) {
  margin-bottom: 2.5rem;
}

.resume-content :deep(.experience-section),
.resume-content :deep(.education-section),
.resume-content :deep(.additional-education-section) {
  position: relative;
}

/* Experience and education entries */
.resume-content :deep(.experience-entry),
.resume-content :deep(.education-entry) {
  margin-bottom: 2rem;
  padding-left: 1.5rem;
  border-left: 2px solid rgba(135, 206, 235, 0.2);
  position: relative;
}

.resume-content :deep(.experience-entry::before),
.resume-content :deep(.education-entry::before) {
  content: '';
  position: absolute;
  left: -5px;
  top: 0.5rem;
  width: 8px;
  height: 8px;
  background: var(--color-accent, #87CEEB);
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.2);
}

.resume-content :deep(.company-name),
.resume-content :deep(.degree) {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.resume-content :deep(.position-title) {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--color-text-light);
  font-style: italic;
  margin-bottom: 0.5rem;
}

.resume-content :deep(.date-range) {
  font-size: 0.9375rem;
  color: var(--color-text-light);
  margin-bottom: 1rem;
  font-weight: 500;
}

.resume-content :deep(.institution) {
  font-size: 1rem;
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}

/* Additional education list */
.resume-content :deep(.additional-education-list) {
  list-style: none;
  padding-left: 0;
}

.resume-content :deep(.additional-education-list li) {
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: rgba(135, 206, 235, 0.05);
  border-radius: 6px;
  border-left: 3px solid var(--color-accent, #87CEEB);
}

.resume-content :deep(.additional-education-list li::before) {
  display: none;
}

/* Visually hidden utility for accessibility */
.resume-content :deep(.visually-hidden) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Print and PDF export styles */
@media print {
  .resume-content {
    background: white;
    padding: 1.5rem;
    box-shadow: none;
    border: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    max-width: 100%;
  }
  
  .resume-content::before {
    display: none;
  }
  
  .resume-content :deep(a) {
    color: #000;
    text-decoration: underline;
  }
  
  .resume-content :deep(a::after) {
    display: none;
  }
  
  .resume-content :deep(h2) {
    border-bottom-color: #333;
    page-break-after: avoid;
  }
  
  .resume-content :deep(h2::after) {
    display: none;
  }
  
  .resume-content :deep(h3),
  .resume-content :deep(h4) {
    page-break-after: avoid;
  }
  
  .resume-content :deep(.experience-entry),
  .resume-content :deep(.education-entry) {
    page-break-inside: avoid;
    border-left-color: #ccc;
  }
  
  .resume-content :deep(.experience-entry::before),
  .resume-content :deep(.education-entry::before) {
    background: #333;
    box-shadow: none;
  }
  
  .resume-content :deep(.resume-contact) {
    background: #f5f5f5;
    border-left-color: #333;
  }
  
  .resume-content :deep(.additional-education-list li) {
    background: #f5f5f5;
    border-left-color: #333;
  }
}

/* PDF export mode (applied via JavaScript) */
.resume-content.pdf-export-mode,
.pdf-export-mode .resume-content {
  background: white !important;
  color: #000 !important;
  padding: 1.5rem;
  box-shadow: none;
  border: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.resume-content.pdf-export-mode::before,
.pdf-export-mode .resume-content::before {
  display: none;
}

.resume-content.pdf-export-mode :deep(h1),
.resume-content.pdf-export-mode :deep(h2),
.resume-content.pdf-export-mode :deep(h3),
.resume-content.pdf-export-mode :deep(h4),
.pdf-export-mode .resume-content :deep(h1),
.pdf-export-mode .resume-content :deep(h2),
.pdf-export-mode .resume-content :deep(h3),
.pdf-export-mode .resume-content :deep(h4) {
  color: #000 !important;
  text-shadow: none !important;
  border-bottom-color: #ccc !important;
}

.resume-content.pdf-export-mode :deep(h2::after),
.pdf-export-mode .resume-content :deep(h2::after) {
  display: none;
}

.resume-content.pdf-export-mode :deep(p),
.resume-content.pdf-export-mode :deep(li),
.resume-content.pdf-export-mode :deep(strong),
.resume-content.pdf-export-mode :deep(em),
.pdf-export-mode .resume-content :deep(p),
.pdf-export-mode .resume-content :deep(li),
.pdf-export-mode .resume-content :deep(strong),
.pdf-export-mode .resume-content :deep(em) {
  color: #000 !important;
}

.resume-content.pdf-export-mode :deep(a),
.pdf-export-mode .resume-content :deep(a) {
  color: #000 !important;
  text-decoration: underline;
  text-shadow: none !important;
}

.resume-content.pdf-export-mode :deep(a::after),
.pdf-export-mode .resume-content :deep(a::after) {
  display: none;
}

.resume-content.pdf-export-mode :deep(ul li::before),
.pdf-export-mode .resume-content :deep(ul li::before) {
  color: #000 !important;
}

.resume-content.pdf-export-mode :deep(.experience-entry),
.resume-content.pdf-export-mode :deep(.education-entry),
.pdf-export-mode .resume-content :deep(.experience-entry),
.pdf-export-mode .resume-content :deep(.education-entry) {
  border-left-color: #ccc !important;
}

.resume-content.pdf-export-mode :deep(.experience-entry::before),
.resume-content.pdf-export-mode :deep(.education-entry::before),
.pdf-export-mode .resume-content :deep(.experience-entry::before),
.pdf-export-mode .resume-content :deep(.education-entry::before) {
  background: #333 !important;
  box-shadow: none !important;
}

.resume-content.pdf-export-mode :deep(.resume-contact),
.pdf-export-mode .resume-content :deep(.resume-contact) {
  background: #f5f5f5 !important;
  border-left-color: #333 !important;
}

.resume-content.pdf-export-mode :deep(.additional-education-list li),
.pdf-export-mode .resume-content :deep(.additional-education-list li) {
  background: #f5f5f5 !important;
  border-left-color: #333 !important;
}

/* Responsive design - Mobile (<768px) */
@media (max-width: 767px) {
  .resume-content {
    padding: 1.5rem;
    border-radius: 8px;
  }
  
  .resume-content :deep(h1) {
    font-size: 1.5rem;
  }
  
  .resume-content :deep(h2) {
    font-size: 1.25rem;
    margin-top: 2rem;
  }
  
  .resume-content :deep(h3) {
    font-size: 1.125rem;
  }
  
  .resume-content :deep(h4) {
    font-size: 1rem;
  }
  
  .resume-content :deep(p) {
    font-size: 0.9375rem;
  }
  
  .resume-content :deep(ul),
  .resume-content :deep(ol) {
    padding-left: 1.5rem;
  }
  
  .resume-content :deep(.experience-entry),
  .resume-content :deep(.education-entry) {
    padding-left: 1rem;
  }
  
  .resume-content :deep(.resume-contact) {
    padding: 1rem;
  }
  
  .resume-content :deep(.additional-education-list li) {
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
  }
}

/* Responsive design - Tablet (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .resume-content {
    padding: 2rem;
  }
  
  .resume-content :deep(h1) {
    font-size: 1.75rem;
  }
  
  .resume-content :deep(h2) {
    font-size: 1.375rem;
  }
  
  .resume-content :deep(h3) {
    font-size: 1.1875rem;
  }
  
  .resume-content :deep(p) {
    font-size: 0.9675rem;
  }
}

/* Desktop (>1024px) - default styles apply */

/* Accessibility - Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .resume-content :deep(a) {
    transition: none;
  }
  
  .resume-content :deep(a::after) {
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .resume-content {
    background: white;
    border: 2px solid #000;
    box-shadow: none;
  }
  
  .resume-content::before {
    display: none;
  }
  
  .resume-content :deep(h2) {
    border-bottom-color: #000;
  }
  
  .resume-content :deep(h2::after) {
    background: #000;
  }
  
  .resume-content :deep(a) {
    color: #0066cc;
    text-decoration: underline;
  }
  
  .resume-content :deep(.experience-entry),
  .resume-content :deep(.education-entry) {
    border-left-color: #000;
  }
  
  .resume-content :deep(.experience-entry::before),
  .resume-content :deep(.education-entry::before) {
    background: #000;
    box-shadow: none;
  }
}
</style>
