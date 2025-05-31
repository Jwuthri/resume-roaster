import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Modern serverless-compatible PDF to image conversion using @napi-rs/canvas + pdfjs-dist
async function convertPDFToImagesModern(pdfBuffer: Buffer): Promise<string[]> {
  try {
    console.log('Converting PDF to images using @napi-rs/canvas + pdfjs-dist...')
    
    // Dynamic imports to avoid bundling issues
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const { createCanvas } = await import('@napi-rs/canvas')
    
    // Configure PDF.js for serverless environment
    ;(pdfjsLib as any).GlobalWorkerOptions.workerSrc = ''
    
    // Load the PDF document with serverless-friendly options
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: false,
      disableFontFace: true,
      isEvalSupported: false,
      useWorkerFetch: false,
      disableAutoFetch: true,
      disableStream: true,
    })
    
    const pdf = await loadingTask.promise
    const images: string[] = []
    const maxPages = Math.min(pdf.numPages, 3) // Limit to 3 pages
    
    console.log(`PDF loaded successfully. Processing ${maxPages} pages...`)
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.5 }) // Higher scale for better quality
        
        // Create canvas using @napi-rs/canvas (serverless-compatible)
        const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height))
        const context = canvas.getContext('2d')
        
        if (!context) {
          throw new Error('Failed to get canvas 2D context')
        }
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context as any,
          viewport: viewport,
          enableWebGL: false,
        }
        
        await page.render(renderContext).promise
        
        // Convert canvas to base64 PNG using @napi-rs/canvas
        const imageBuffer = await canvas.encode('png')
        const base64Data = imageBuffer.toString('base64')
        images.push(base64Data)
        
        console.log(`✅ Converted page ${pageNum} to image (${Math.round(base64Data.length / 1024)}KB)`)
        
        // Clean up
        page.cleanup()
      } catch (pageError) {
        const errorMessage = pageError instanceof Error ? pageError.message : 'Unknown error'
        console.warn(`Failed to convert page ${pageNum}:`, errorMessage)
        // Continue with other pages
      }
    }
    
    console.log(`🎉 Successfully converted ${images.length} pages to images using @napi-rs/canvas`)
    return images
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error converting PDF to images with @napi-rs/canvas:', errorMessage)
    throw error
  }
}

// Legacy system-based conversion (for local development with system tools)
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
  // Always try the modern serverless-compatible method first
  console.log('🚀 Using modern serverless-compatible PDF to image conversion')
  try {
    return await convertPDFToImagesModern(pdfBuffer)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Modern PDF conversion failed:', errorMessage)
    
    // Detect if we're in a local environment and try system tools as fallback
    const isLocal = !process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.NETLIFY
    
    if (isLocal) {
      console.log('🖥️ Detected local environment, trying system tools as fallback...')
      try {
        const systemImages = await convertPDFToImagesSystem(pdfBuffer)
        if (systemImages.length > 0) {
          return systemImages
        }
      } catch (systemError) {
        console.log('System tools also failed, continuing without images...')
      }
    }
    
    console.log('PDF image conversion not available, continuing with text-only extraction...')
    return []
  }
} 