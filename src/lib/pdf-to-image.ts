import fs from 'fs/promises'
import path from 'path'
import os from 'os'

// PDF to JPEG conversion using Puppeteer + Chromium (serverless-compatible)
export async function convertPDFToImages(pdfBuffer: Buffer): Promise<string[]> {
  console.log('🖼️ Converting PDF to JPEG images using Puppeteer + Chromium...')
  
  try {
    // Dynamic imports for serverless compatibility
    const puppeteer = await import('puppeteer-core')
    const chromium = await import('@sparticuz/chromium')
    
    console.log(`📄 Processing PDF: ${Math.round(pdfBuffer.length / 1024)}KB`)
    
    // Configure Chromium for serverless
    const browser = await puppeteer.default.launch({
      args: [
        ...chromium.default.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
    })
    
    try {
      const page = await browser.newPage()
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1024,
        height: 1448, // A4 ratio
        deviceScaleFactor: 1
      })
      
      // Create PDF data URL
      const pdfDataUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
      
      console.log('🔄 Loading PDF in browser...')
      
      // Navigate to PDF
      await page.goto(pdfDataUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      })
      
      // Wait for PDF to load
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('📸 Taking screenshots of PDF pages...')
      
      const images: string[] = []
      const maxPages = 3 // Limit to 3 pages
      
      // Method 1: Try to detect PDF pages and screenshot each
      try {
        // For Chrome's built-in PDF viewer, we can try to navigate pages
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          try {
            console.log(`📸 Capturing page ${pageNum}...`)
            
            // Take screenshot of current view
            const screenshot = await page.screenshot({
              type: 'jpeg',
              quality: 85,
              fullPage: false, // Just the viewport
              clip: {
                x: 0,
                y: 0,
                width: 1024,
                height: 1448
              }
            })
            
            const base64Data = Buffer.from(screenshot).toString('base64')
            images.push(base64Data)
            
            console.log(`✅ Captured page ${pageNum} (${Math.round(base64Data.length / 1024)}KB)`)
            
            // Try to go to next page (this might not work for all PDF viewers)
            if (pageNum < maxPages) {
              try {
                // Try pressing Page Down or Arrow Down
                await page.keyboard.press('PageDown')
                await new Promise(resolve => setTimeout(resolve, 1000))
              } catch (navError) {
                console.log(`Navigation to page ${pageNum + 1} failed, stopping`)
                break
              }
            }
            
          } catch (pageError) {
            console.warn(`Failed to capture page ${pageNum}:`, pageError)
            break
          }
        }
        
      } catch (screenshotError) {
        console.warn('Screenshot method failed:', screenshotError)
        
        // Fallback: Just take one screenshot of the whole PDF view
        try {
          console.log('📸 Taking fallback screenshot...')
          const screenshot = await page.screenshot({
            type: 'jpeg',
            quality: 85,
            fullPage: true
          })
          
          const base64Data = Buffer.from(screenshot).toString('base64')
          images.push(base64Data)
          
          console.log(`✅ Captured fallback screenshot (${Math.round(base64Data.length / 1024)}KB)`)
        } catch (fallbackError) {
          console.error('Fallback screenshot also failed:', fallbackError)
        }
      }
      
      await page.close()
      
      console.log(`🎉 Successfully converted PDF to ${images.length} JPEG images`)
      return images
      
    } finally {
      await browser.close()
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error converting PDF to JPEG images:', errorMessage)
    
    // Return empty array to fall back to text-only mode
    console.log('📝 Falling back to text-only extraction...')
    return []
  }
} 