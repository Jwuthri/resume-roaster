import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ResumeService, ExtractedResumeService, UserService, generateFileHash } from '@/lib/database'
import JSZip from 'jszip'
import crypto from 'crypto'

interface ExtractedResumeData {
  text: string
  resumeId?: string
  extractedResumeId?: string
  metadata: {
    pages: number
    wordCount: number
    fileName: string
    fileSize: number
    extractedAt: string
    fileType: string
    fromCache?: boolean
  }
}

// Helper function to extract text from TXT files
async function extractFromTxt(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8')
}

// Helper function to extract text from DOC files (basic implementation)
async function extractFromDoc(buffer: Buffer): Promise<string> {
  // For now, we'll try to extract basic text from DOC files
  // This is a simplified approach - in production, you might want to use a library like 'mammoth'
  try {
    const text = buffer.toString('utf-8')
    // Remove common DOC binary artifacts and extract readable text
    const cleanText = text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    if (cleanText.length < 50) {
      throw new Error('Unable to extract meaningful text from DOC file')
    }
    
    return cleanText
  } catch (error) {
    throw new Error('Failed to extract text from DOC file. Please convert to PDF or DOCX format.')
  }
}

// Helper function to extract text from DOCX files
async function extractFromDocx(buffer: Buffer): Promise<string> {
  try {
    // For DOCX files, we'll use a simple approach to extract text
    // In production, you might want to use a library like 'mammoth' or 'docx-parser'
    const zip = new JSZip()
    const docx = await zip.loadAsync(buffer)
    
    // Extract the main document content
    const documentXml = await docx.file('word/document.xml')?.async('string')
    
    if (!documentXml) {
      throw new Error('Unable to find document content in DOCX file')
    }
    
    // Simple XML text extraction (removes tags)
    const text = documentXml
      .replace(/<[^>]*>/g, ' ') // Remove XML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    if (text.length < 50) {
      throw new Error('Unable to extract meaningful text from DOCX file')
    }
    
    return text
  } catch (error) {
    throw new Error('Failed to extract text from DOCX file. Please ensure the file is not corrupted.')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bypassCache = (formData.get('bypassCache') as string) === 'true'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const allowedExtensions = ['.txt', '.doc', '.docx']
    
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    
    if (!isValidType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload TXT, DOC, or DOCX files.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit for text files)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 5MB allowed for text files.' },
        { status: 400 }
      )
    }

    console.log(`Starting text extraction for: ${file.name}, Bypass Cache: ${bypassCache}`)

    // Convert file to buffer and generate hash
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileHash = generateFileHash(buffer)
    
    console.log(`File hash: ${fileHash}`)

    // Check if resume was already processed
    const existingResume = await ResumeService.findByHash(fileHash)
    
    if (existingResume && !bypassCache) {
      console.log(`Found cached resume for ${file.name}`)
      
      // Check if we have extracted data for this resume
      const resumeContentHash = crypto.createHash('sha256').update(fileHash + 'extracted').digest('hex')
      const existingExtracted = await ExtractedResumeService.findByHash(resumeContentHash)
      
      if (existingExtracted) {
        const data = existingExtracted.data as any
        const extractedData: ExtractedResumeData = {
          text: data?.text || '',
          resumeId: existingResume.id,
          extractedResumeId: existingExtracted.id,
          metadata: {
            pages: data?.pages || 1,
            wordCount: data?.wordCount || 0,
            fileName: file.name,
            fileSize: file.size,
            extractedAt: existingExtracted.createdAt.toISOString(),
            fileType: file.type,
            fromCache: true
          }
        }

        return NextResponse.json({
          success: true,
          data: extractedData,
          summary: data?.summary || "Resume content extracted from cache",
          sections: data?.sections || ["Resume Content"],
          fromCache: true,
          resumeId: existingResume.id,
          extractedResumeId: existingExtracted.id,
          fileHash: fileHash
        })
      }
    }

    if (bypassCache) {
      console.log(`🔄 BYPASS CACHE: Force re-extracting text file`)
    }

    // Extract text based on file type
    let extractedText: string
    let fileType: string
    
    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      extractedText = await extractFromTxt(buffer)
      fileType = 'txt'
    } else if (file.type === 'application/msword' || file.name.toLowerCase().endsWith('.doc')) {
      extractedText = await extractFromDoc(buffer)
      fileType = 'doc'
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
      extractedText = await extractFromDocx(buffer)
      fileType = 'docx'
    } else {
      throw new Error('Unsupported file type')
    }

    // Count words
    const wordCount = extractedText.split(/\s+/).filter((word: string) => word.length > 0).length

    // Estimate pages (rough estimate based on typical resume length)
    const estimatedPages = Math.ceil(wordCount / 500) // Assume ~500 words per page

    // Save resume to database
    let savedResume = existingResume
    if (!savedResume) {
      savedResume = await ResumeService.create({
        userId: userId || undefined,
        filename: file.name,
        fileHash: fileHash,
        mimeType: file.type,
        images: [], // No images for text files
        metadata: {
          originalSize: file.size,
          extractionMethod: 'text',
          fileType
        }
      })
    }

    // Save extracted data
    const resumeContentHash = crypto.createHash('sha256').update(fileHash + 'extracted').digest('hex')
    
    // If bypassing cache, delete existing extracted data first
    if (bypassCache && existingResume) {
      const existingExtracted = await ExtractedResumeService.findByHash(resumeContentHash)
      if (existingExtracted) {
        console.log(`🗑️ BYPASS CACHE: Deleting existing extracted data for fresh extraction`)
        await ExtractedResumeService.delete(existingExtracted.id)
      }
    }
    
    // Check if we already have extracted data for this resume
    let extractedData = await ExtractedResumeService.findByHash(resumeContentHash)
    
    if (!extractedData) {
      // Create new extracted data record
      extractedData = await ExtractedResumeService.create({
        resumeId: savedResume.id,
        userId: userId || undefined, // Include the user ID
        contentHash: resumeContentHash,
        data: {
          text: extractedText,
          wordCount,
          estimatedPages,
          extractedAt: new Date().toISOString(),
          fileType
        }
      })
      console.log('Created new extracted data record')
    } else {
      console.log('Using existing extracted data')
    }

    const resultData: ExtractedResumeData = {
      text: extractedText,
      resumeId: savedResume.id,
      extractedResumeId: extractedData.id,
      metadata: {
        pages: estimatedPages,
        wordCount,
        fileName: file.name,
        fileSize: file.size,
        extractedAt: extractedData.createdAt.toISOString(),
        fileType,
        fromCache: false
      }
    }

    console.log(`Successfully extracted ${wordCount} words from ${fileType.toUpperCase()} file`)

    return NextResponse.json({
      success: true,
      data: resultData,
      summary: `Resume content extracted from ${fileType.toUpperCase()} file`,
      sections: ["Resume Content"],
      fromCache: false,
      resumeId: savedResume.id,
      extractedResumeId: extractedData.id,
      fileHash: fileHash
    })

  } catch (error) {
    console.error('Text extraction error:', error)
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Unable to extract') || error.message.includes('Failed to extract')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      
      if (error.message.includes('corrupted')) {
        return NextResponse.json(
          { error: 'File appears to be corrupted. Please try uploading a different file.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to extract text from file. Please try again.' },
      { status: 500 }
    )
  }
} 