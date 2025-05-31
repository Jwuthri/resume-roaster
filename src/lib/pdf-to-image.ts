import fs from 'fs/promises'
import path from 'path'
import os from 'os'

// PDF to JPEG conversion using external Heroku microservice
export async function convertPDFToImages(pdfBuffer: Buffer): Promise<string[]> {
  console.log('🖼️ Converting PDF to JPEG images using Heroku microservice...')
  
  try {
    // Get the microservice URL from environment variables
    const microserviceUrl = process.env.PDF_CONVERTER_SERVICE_URL || 'https://your-pdf-converter-app.herokuapp.com'
    
    console.log(`📄 Processing PDF: ${Math.round(pdfBuffer.length / 1024)}KB`)
    console.log(`🌐 Using microservice: ${microserviceUrl}`)
    
    // Create FormData with the PDF file
    const formData = new FormData()
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' })
    formData.append('file', pdfBlob, 'document.pdf')
    
    console.log('🔄 Sending PDF to microservice...')
    
    // Send request to microservice
    const response = await fetch(`${microserviceUrl}/pdf-to-images`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header - let the browser set it with boundary for multipart/form-data
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(`Conversion failed: ${JSON.stringify(result)}`)
    }
    
    const images = result.images || []
    console.log(`✅ Successfully converted PDF to ${images.length} JPEG images`)
    
    // Log image sizes for debugging
    images.forEach((image: string, index: number) => {
      const sizeKB = Math.round(image.length / 1024)
      console.log(`📷 Image ${index + 1}: ${sizeKB}KB base64 data`)
    })
    
    return images
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error converting PDF to JPEG images:', errorMessage)
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    // Return empty array to fall back to text-only mode
    console.log('📝 Falling back to text-only extraction...')
    return []
  }
} 