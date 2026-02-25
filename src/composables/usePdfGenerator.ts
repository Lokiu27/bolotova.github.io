import { ref } from 'vue'

/**
 * Composable for generating PDF from HTML content
 * 
 * Features:
 * - Lazy loads jspdf and html2canvas libraries
 * - Configures PDF with A4 portrait format
 * - High-quality canvas rendering (scale: 2)
 * - Multi-page PDF generation with pagination
 * - Cyrillic font support
 * - Error handling with browser print fallback
 */
export function usePdfGenerator() {
  const isGenerating = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * Generate PDF from HTML element
   * 
   * @param element - HTML element to convert to PDF
   * @param filename - Name for the downloaded PDF file
   */
  const generatePdf = async (element: HTMLElement, filename: string): Promise<void> => {
    isGenerating.value = true
    error.value = null

    try {
      // Lazy load libraries with timeout
      const [jsPDFModule, html2canvasModule] = await Promise.race([
        Promise.all([
          import('jspdf'),
          import('html2canvas')
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Превышено время ожидания загрузки библиотек')), 10000)
        )
      ])

      const { jsPDF } = jsPDFModule
      const html2canvas = html2canvasModule.default

      // Clone element to avoid modifying visible DOM
      const clonedElement = element.cloneNode(true) as HTMLElement
      
      // Apply PDF export styles by adding class to cloned element
      clonedElement.classList.add('pdf-export-mode')
      
      // Also apply styles directly for better compatibility
      clonedElement.style.background = 'white'
      clonedElement.style.color = '#000'
      
      // Temporarily add to DOM for rendering
      clonedElement.style.position = 'absolute'
      clonedElement.style.left = '-9999px'
      document.body.appendChild(clonedElement)

      try {
        // Generate canvas with high quality settings
        const canvas = await html2canvas(clonedElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 800 // Optimal width for A4 content
        })

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          throw new Error('Не удалось создать изображение содержимого')
        }

        // Create PDF with A4 portrait configuration
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        })

        // A4 dimensions in mm
        const pageWidth = 210
        const pageHeight = 297
        
        // Standard margins in mm (20mm top/bottom, 15mm left/right)
        const marginTop = 20
        const marginBottom = 20
        const marginLeft = 15
        const marginRight = 15
        
        // Content area dimensions
        const contentWidth = pageWidth - marginLeft - marginRight
        const contentHeight = pageHeight - marginTop - marginBottom

        // Calculate image dimensions to fit content area
        const imgWidth = contentWidth
        const imgHeight = (canvas.height * contentWidth) / canvas.width

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png', 1.0)

        // Calculate how many pages we need
        const totalPages = Math.ceil(imgHeight / contentHeight)

        // Add pages with proper margins
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage()
          }

          // Calculate the portion of the image for this page
          const sourceY = page * contentHeight * (canvas.width / contentWidth)
          const sourceHeight = Math.min(
            contentHeight * (canvas.width / contentWidth),
            canvas.height - sourceY
          )

          // Create a temporary canvas for this page's content
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = sourceHeight
          
          const pageCtx = pageCanvas.getContext('2d')
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY,
              canvas.width, sourceHeight,
              0, 0,
              canvas.width, sourceHeight
            )

            const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
            const pageImgHeight = (sourceHeight * contentWidth) / canvas.width

            // Add image with margins
            pdf.addImage(
              pageImgData,
              'PNG',
              marginLeft,
              marginTop,
              imgWidth,
              pageImgHeight
            )
          }
        }

        // Download PDF
        pdf.save(filename)
      } finally {
        // Clean up cloned element
        document.body.removeChild(clonedElement)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      error.value = `Ошибка генерации PDF: ${errorMessage}`
      console.error('PDF generation error:', err)

      // Provide fallback: browser print dialog
      const usePrintFallback = confirm(
        'Не удалось создать PDF. Использовать печать браузера?'
      )
      
      if (usePrintFallback) {
        window.print()
      }
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generatePdf,
    isGenerating,
    error
  }
}
