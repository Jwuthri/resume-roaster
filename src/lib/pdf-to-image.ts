import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Serverless-compatible PDF to image conversion using pdfjs-dist
async function convertPDFToImagesServerless(pdfBuffer: Buffer): Promise<string[]> {
  try {
    console.log('Converting PDF to images using pdfjs-dist (serverless)...')
    
    // Dynamic import to avoid bundling issues - use legacy build for Node.js
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const { createCanvas } = await import('canvas')
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      disableFontFace: false,
    })
    
    const pdf = await loadingTask.promise
    const images: string[] = []
    const maxPages = Math.min(pdf.numPages, 3) // Limit to 3 pages
    
    console.log(`PDF loaded successfully. Processing ${maxPages} pages...`)
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.5 }) // Higher scale for better quality
        
        // Create canvas
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context as any, // Type assertion for compatibility
          viewport: viewport,
        }
        
        await page.render(renderContext).promise
        
        // Convert canvas to base64 PNG
        const imageBuffer = canvas.toBuffer('image/png')
        const base64Data = imageBuffer.toString('base64')
        images.push(base64Data)
        
        console.log(`✅ Converted page ${pageNum} to image (${Math.round(base64Data.length / 1024)}KB)`)
        
        // Clean up
        page.cleanup()
      } catch (pageError) {
        console.warn(`Failed to convert page ${pageNum}:`, pageError)
        // Continue with other pages
      }
    }
    
    console.log(`🎉 Successfully converted ${images.length} pages to images using pdfjs-dist`)
    return images
    
  } catch (error) {
    console.error('❌ Error converting PDF to images with pdfjs-dist:', error)
    throw error
  }
}

// Legacy system-based conversion (for local development)
async function convertPDFToImagesSystem(pdfBuffer: Buffer): Promise<string[]> {
  try {
    console.log('Converting PDF to images using system tools...')
    
    // Create temporary directory for processing
    const tempDir = os.tmpdir()
    const tempPdfPath = path.join(tempDir, `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`)
    const tempOutputDir = path.join(tempDir, `pdf_images_${Date.now()}_${Math.random().toString(36).substring(7)}`)
    
    try {
      // Write PDF buffer to temporary file
      await fs.writeFile(tempPdfPath, pdfBuffer)
      
      // Create output directory
      await fs.mkdir(tempOutputDir, { recursive: true })
      
      // Try to use ImageMagick convert command (if available)
      try {
        const outputPattern = path.join(tempOutputDir, 'page-%d.png')
        await execAsync(`convert -density 150 "${tempPdfPath}[0-2]" "${outputPattern}"`)
        
        // Read generated images
        const images: string[] = []
        const files = await fs.readdir(tempOutputDir)
        const imageFiles = files.filter(f => f.endsWith('.png')).sort()
        
        for (const file of imageFiles.slice(0, 3)) { // Limit to 3 pages
          const imagePath = path.join(tempOutputDir, file)
          const imageBuffer = await fs.readFile(imagePath)
          const base64Data = imageBuffer.toString('base64')
          images.push(base64Data)
          console.log(`✅ Converted page to image (${Math.round(base64Data.length / 1024)}KB)`)
        }
        
        console.log(`🎉 Successfully converted ${images.length} pages to images`)
        return images
        
      } catch (convertError) {
        console.log('ImageMagick not available, trying alternative method...')
        
        // Fallback: Try using poppler-utils (if available)
        try {
          await execAsync(`pdftoppm -png -f 1 -l 3 -scale-to 1024 "${tempPdfPath}" "${path.join(tempOutputDir, 'page')}"`)
          
          // Read generated images
          const images: string[] = []
          const files = await fs.readdir(tempOutputDir)
          const imageFiles = files.filter(f => f.endsWith('.png')).sort()
          
          for (const file of imageFiles.slice(0, 3)) { // Limit to 3 pages
            const imagePath = path.join(tempOutputDir, file)
            const imageBuffer = await fs.readFile(imagePath)
            const base64Data = imageBuffer.toString('base64')
            images.push(base64Data)
            console.log(`✅ Converted page to image (${Math.round(base64Data.length / 1024)}KB)`)
          }
          
          console.log(`🎉 Successfully converted ${images.length} pages to images using poppler`)
          return images
          
        } catch (popplerError) {
          console.log('Poppler-utils not available either. PDF image conversion disabled.')
          return []
        }
      }
      
    } finally {
      // Clean up temporary files
      try {
        await fs.unlink(tempPdfPath)
        const files = await fs.readdir(tempOutputDir)
        for (const file of files) {
          await fs.unlink(path.join(tempOutputDir, file))
        }
        await fs.rmdir(tempOutputDir)
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files:', cleanupError)
      }
    }
    
  } catch (error) {
    console.error('❌ Error converting PDF to images:', error)
    console.log('Continuing without images...')
    return []
  }
}

export async function convertPDFToImages(pdfBuffer: Buffer): Promise<string[]> {
  // Detect if we're in a serverless environment (Vercel)
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
  
  if (isServerless) {
    console.log('🚀 Detected serverless environment, using pdfjs-dist for PDF conversion')
    try {
      return await convertPDFToImagesServerless(pdfBuffer)
    } catch (error) {
      console.error('Serverless PDF conversion failed:', error)
      console.log('Falling back to no images...')
      return []
    }
  } else {
    console.log('🖥️ Detected local environment, trying system tools first')
    try {
      // Try system tools first in local environment
      const systemImages = await convertPDFToImagesSystem(pdfBuffer)
      if (systemImages.length > 0) {
        return systemImages
      }
    } catch (error) {
      console.log('System tools failed, falling back to pdfjs-dist...')
    }
    
    // Fallback to serverless method even in local environment
    try {
      return await convertPDFToImagesServerless(pdfBuffer)
    } catch (error) {
      console.error('All PDF conversion methods failed:', error)
      return []
    }
  }
} 