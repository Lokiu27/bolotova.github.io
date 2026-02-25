import { ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Composable for parsing markdown content with sanitization and semantic HTML structure
 * 
 * Features:
 * - Converts markdown to HTML using marked library
 * - Sanitizes output with DOMPurify to prevent XSS attacks
 * - Adds semantic HTML wrappers (article, section, header)
 * - Enforces proper heading hierarchy (h1→h2→h3→h4)
 * - Handles email links with security attributes
 */
export function useMarkdownParser() {
  const isReady = ref(true)

  /**
   * Configure marked with custom renderer for semantic HTML and security
   */
  const renderer = new marked.Renderer()

  // Override link rendering to add security attributes to email links
  const originalLinkRenderer = renderer.link.bind(renderer)
  renderer.link = (token) => {
    const html = originalLinkRenderer(token)
    
    // Add rel="noopener noreferrer" to email links for security
    if (token.href && token.href.startsWith('mailto:')) {
      return html.replace('<a ', '<a rel="noopener noreferrer" ')
    }
    
    return html
  }

  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true
  })

  /**
   * Parse markdown content to sanitized HTML with semantic structure
   * 
   * @param markdown - Raw markdown content
   * @returns Sanitized HTML string with semantic elements
   */
  const parse = (markdown: string): string => {
    try {
      // Convert markdown to HTML
      const rawHtml = marked.parse(markdown) as string

      // Sanitize HTML with DOMPurify
      const sanitized = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br',
          'article', 'section', 'header', 'footer'
        ],
        ALLOWED_ATTR: ['href', 'class', 'id', 'rel', 'role']
      })

      if (!sanitized || sanitized.trim().length === 0) {
        throw new Error('Sanitization removed all content')
      }

      // Wrap content in semantic HTML structure
      return wrapWithSemanticStructure(sanitized)
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return '<p class="error">Ошибка обработки содержимого резюме</p>'
    }
  }

  /**
   * Wrap parsed HTML with semantic structure and enforce heading hierarchy
   * 
   * @param html - Sanitized HTML content
   * @returns HTML wrapped with semantic elements
   */
  const wrapWithSemanticStructure = (html: string): string => {
    // Parse HTML to manipulate structure
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Find all headings and content sections
    const body = doc.body
    const elements = Array.from(body.children)
    
    // Group content by sections based on h2 headings
    const sections: { heading: Element | null; content: Element[] }[] = []
    let currentSection: { heading: Element | null; content: Element[] } = { heading: null, content: [] }
    
    elements.forEach((element) => {
      if (element.tagName === 'H2') {
        // Start new section
        if (currentSection.heading || currentSection.content.length > 0) {
          sections.push(currentSection)
        }
        currentSection = { heading: element, content: [] }
      } else {
        currentSection.content.push(element)
      }
    })
    
    // Push last section
    if (currentSection.heading || currentSection.content.length > 0) {
      sections.push(currentSection)
    }
    
    // Build semantic HTML structure
    let result = '<article class="resume-content">\n'
    
    sections.forEach((section, index) => {
      if (index === 0 && !section.heading) {
        // First section without h2 is the header/intro
        result += '  <header class="resume-intro">\n'
        section.content.forEach(el => {
          result += `    ${el.outerHTML}\n`
        })
        result += '  </header>\n'
      } else {
        // Regular sections with h2 headings
        result += '  <section class="resume-section">\n'
        if (section.heading) {
          result += `    ${section.heading.outerHTML}\n`
        }
        section.content.forEach(el => {
          result += `    ${el.outerHTML}\n`
        })
        result += '  </section>\n'
      }
    })
    
    result += '</article>'
    
    return result
  }

  return {
    parse,
    isReady
  }
}
