import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ResumeService, ExtractedResumeService, UserService, generateFileHash } from '@/lib/database'
import { LLMLogger, MessageRole } from '@/lib/llm-logger'
import { ANTHROPIC_MODELS, callAnthropicResumeOptimization, callAnthropicPDFExtraction, ANTHROPIC_CONTEXT_SIZES, ANTHROPIC_TEMPERATURES } from '@/lib/anthropic-utils'
import { convertPDFToImages } from '@/lib/pdf-to-image'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { OPENAI_MODELS } from '@/lib/openai-utils'

interface ExtractedResumeData {
  text: string
  structuredData?: any
  resumeId?: string
  extractedResumeId?: string
  metadata: {
    pages: number
    wordCount: number
    fileName: string
    fileSize: number
    extractedAt: string
    aiProvider: string
    fromCache?: boolean
    tokensUsed?: number
    estimatedCost?: number
  }
}

// Basic PDF text extraction using pdf-parse and node-poppler
const extractTextFromPDFBasic = async (filePath: string, originalName?: string): Promise<string> => {
  console.log(`Starting basic PDF extraction for: ${originalName || filePath}`)
  
  // Try node-poppler first (most reliable for PDF text extraction)
  try {
    console.log('Attempting extraction with node-poppler...')
    const { Poppler } = await import('node-poppler')
    const poppler = new Poppler()
    
    // Extract text using poppler's pdfToText method
    const text = await poppler.pdfToText(filePath)
    
    if (text && text.trim().length > 0) {
      console.log(`Successfully extracted ${text.length} characters with node-poppler`)
      return text.trim()
    }
  } catch (error) {
    console.log('node-poppler failed, trying pdf-parse...', error)
  }

  // Fallback to pdf-parse - import directly from lib to bypass bundling issues
  try {
    console.log('Attempting extraction with pdf-parse...')
    // Import directly from lib to bypass index bundling issues
    const pdfParse = require('pdf-parse/lib/pdf-parse')
    const buffer = await fs.readFile(filePath)
    
    // Ensure we have a valid buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid or empty PDF buffer')
    }
    
    const data = await pdfParse(buffer, {
      // Add options for better compatibility
      max: 0, // No page limit
    })
    
    if (data.text && data.text.trim().length > 0) {
      console.log(`Successfully extracted ${data.text.length} characters with pdf-parse`)
      return data.text.trim()
    }
  } catch (error) {
    console.log('pdf-parse failed:', error)
  }

  throw new Error('Failed to extract text from PDF using all available methods')
}

export async function POST(request: NextRequest) {
  let llmCallId: string | null = null

  try {
    console.log('=== PDF AI Extraction API Called ===')
    
    // Get session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    console.log(`User ID: ${userId || 'anonymous'}`)

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const extractionMethod = (formData.get('extractionMethod') as string) || 'ai'
    const provider = (formData.get('provider') as string) || 'anthropic'
    const model = formData.get('model') as string // New model parameter
    const bypassCache = (formData.get('bypassCache') as string) === 'true'
    const useAI = extractionMethod === 'ai'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`Processing file: ${file.name} (${file.size} bytes)`)
    console.log(`Method: ${extractionMethod}, Use AI: ${useAI}, Provider: ${provider}, Model: ${model || 'default'}, Bypass Cache: ${bypassCache}`)

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
    }

    // Convert file to buffer and generate hash
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileHash = generateFileHash(buffer)
    
    console.log(`File hash: ${fileHash}`)
    console.log(`Cache key will be: ${fileHash}-${extractionMethod}-${useAI ? `${provider}-${model || 'default'}` : 'basic'}`)

    // Check if resume was already processed
    const existingResume = await ResumeService.findByHash(fileHash)
    
    if (existingResume && !bypassCache) {
      console.log(`Found cached resume for ${file.name}`)
      
      // Check if we have extracted data for this resume with the same method, provider, and model
      const cacheKey = `${fileHash}-${extractionMethod}-${useAI ? `${provider}-${model || 'default'}` : 'basic'}`
      const resumeContentHash = crypto.createHash('sha256').update(cacheKey).digest('hex')
      const existingExtracted = await ExtractedResumeService.findByHash(resumeContentHash)
      
      if (existingExtracted) {
        console.log(`Found cached extraction for method: ${extractionMethod}, provider: ${useAI ? provider : 'basic'}, model: ${model || 'default'}`)
        const data = existingExtracted.data as any // Type assertion for JSON data
        const extractedData: ExtractedResumeData = {
          text: data?.text || '',
          structuredData: data?.structuredData || null,
          resumeId: existingResume.id,
          extractedResumeId: existingExtracted.id,
          metadata: {
            pages: data?.pages || 1,
            wordCount: data?.wordCount || 0,
            fileName: file.name,
            fileSize: file.size,
            extractedAt: existingExtracted.createdAt.toISOString(),
            aiProvider: data?.aiProvider || 'cached',
            fromCache: true,
            tokensUsed: data?.tokensUsed || 0,
            estimatedCost: data?.estimatedCost || 0
          }
        }

        return NextResponse.json({
          success: true,
          data: extractedData,
          summary: data?.summary || "Resume content extracted from cache",
          sections: data?.sections || ["Resume Content"],
          images: existingResume.images || [],
          fromCache: true,
          resumeId: existingResume.id,
          extractedResumeId: existingExtracted.id,
          fileHash: fileHash,
          extractionMethod: data?.extractionMethod || 'unknown',
          hasImages: (existingResume.images || []).length > 0,
          imageCount: (existingResume.images || []).length
        })
      }
    }

    if (bypassCache) {
      console.log(`🔄 BYPASS CACHE: Force re-extracting for method: ${extractionMethod}, provider: ${useAI ? provider : 'basic'}, model: ${model || 'default'}`)
    } else {
      console.log(`No cached extraction found for method: ${extractionMethod}, provider: ${useAI ? provider : 'basic'}, model: ${model || 'default'}. Proceeding with new extraction.`)
    }

    // Only check and deduct credits if using AI extraction
    let affordability: any = null
    if (useAI && userId) {
      // Determine the model to use for credit calculation
      const selectedModel = model || (provider === 'openai' ? OPENAI_MODELS.MINI : ANTHROPIC_MODELS.SONNET)
      
      // Check if user can afford this model
      affordability = await UserService.checkModelAffordability(userId, selectedModel)
      if (!affordability.canAfford) {
        return NextResponse.json(
          { 
            error: `Insufficient credits. This model costs ${affordability.creditCost} credits, but you only have ${affordability.remaining} credits remaining.`,
            creditCost: affordability.creditCost,
            remaining: affordability.remaining,
            tier: affordability.tier
          },
          { status: 402 } // Payment Required
        )
      }
    }

    // Extract text from PDF
    let extractedText: string
    let structuredData: any = null
    let pdfImages: string[] = []
    let tokensUsed = 0
    let estimatedCost = 0

    console.log('Extracting text from PDF...')
    
    // Create temporary file for processing
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `pdf_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`)
    
    try {
      // Write buffer to temporary file
      await fs.writeFile(tempFilePath, buffer)
      
      // Extract text using basic methods
      extractedText = await extractTextFromPDFBasic(tempFilePath, file.name)
      
      // Generate images for preview
      try {
        pdfImages = await convertPDFToImages(buffer)
        console.log(`Generated ${pdfImages.length} page images`)
      } catch (imageError) {
        console.warn('Failed to generate PDF images:', imageError)
        pdfImages = []
      }
      
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(tempFilePath)
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError)
      }
    }

    // Use AI to extract structured data if requested
    if (useAI && extractedText.length > 50) {
      console.log(`Using AI to extract structured resume data with ${provider}...`)
      
      try {
        // Create LLM call for logging
        llmCallId = await LLMLogger.createLlmCall({
          userId: userId || undefined,
          provider: provider,
          model: model || (provider === 'openai' ? OPENAI_MODELS.MINI : ANTHROPIC_MODELS.SONNET),
          operationType: 'resume_extraction'
        })

        // Create the extraction prompt
        const prompt = pdfImages.length > 0 
          ? `Analyze the PDF images of this resume and extract the content into clean, professional markdown format.

IMPORTANT INSTRUCTIONS:
1. Extract ALL text content visible in the images accurately
2. Preserve the original structure and formatting as much as possible
3. Organize content into logical sections (Personal Info, Summary, Experience, Education, Skills, etc.)
4. Format dates consistently (MM/YYYY format)
5. Use proper markdown formatting (headers, lists, bold text, etc.)
6. Include all achievements, responsibilities, and details visible in the images
7. Pay attention to visual formatting cues like bullet points, headers, and sections
8. If text is partially obscured or unclear, make reasonable inferences based on context
9. Organize skills into categories if possible
10. Return the content as clean, professional markdown

Please use the extract_resume_content function to return the formatted content.`
          : `Extract and format the following resume content from PDF text into clean, professional markdown:

RESUME TEXT:
${extractedText}

IMPORTANT INSTRUCTIONS:
1. Convert the resume content to clean, well-formatted markdown
2. Preserve all information from the original text
3. Organize content into logical sections (Personal Info, Summary, Experience, Education, Skills, etc.)
4. Format dates consistently (MM/YYYY format)
5. Use proper markdown formatting (headers, lists, bold text, etc.)
6. Clean up any OCR artifacts or formatting issues
7. Maintain professional structure and readability
8. Include all achievements, responsibilities, and details
9. Organize skills into categories if possible
10. You must return the as markdown format!!

Please use the extract_resume_content function to return the formatted content.`

        await LLMLogger.logMessage({
          llmCallId,
          role: MessageRole.user,
          content: prompt,
          messageIndex: 0
        })

        console.log(`Sending request to ${provider} for PDF extraction...`)
        console.log(`Using ${pdfImages.length > 0 ? 'VISION' : 'TEXT'} mode with ${pdfImages.length} images`)

        const startTime = Date.now()
        let response

        if (provider === 'openai') {
          // Use OpenAI for PDF extraction
          const { callOpenAIPDFExtraction, callOpenAIPDFExtractionWithVision, OPENAI_MODELS, CONTEXT_SIZES, TEMPERATURES } = await import('@/lib/openai-utils')
          
          // Determine the model to use (with fallback to default)
          const selectedModel = model || OPENAI_MODELS.MINI
          
          if (pdfImages.length > 0) {
            // Use vision-capable extraction
            response = await callOpenAIPDFExtractionWithVision(prompt, pdfImages, {
              model: selectedModel,
              maxTokens: CONTEXT_SIZES.NORMAL,
              temperature: TEMPERATURES.LOW,
              systemPrompt: 'You are an expert resume parser and formatter. Extract resume content from PDF images and format it as clean, professional markdown that preserves all information while improving readability.'
            })
          } else {
            // Fallback to text-only extraction
            response = await callOpenAIPDFExtraction(prompt, {
              model: selectedModel,
              maxTokens: CONTEXT_SIZES.NORMAL,
              temperature: TEMPERATURES.LOW,
              systemPrompt: 'You are an expert resume parser and formatter. Extract resume content from PDF text and format it as clean, professional markdown that preserves all information while improving readability.'
            })
          }
        } else {
          // Use Anthropic for PDF extraction
          const { callAnthropicPDFExtraction, callAnthropicPDFExtractionWithVision } = await import('@/lib/anthropic-utils')
          
          // Determine the model to use (with fallback to default)
          const selectedModel = model || ANTHROPIC_MODELS.SONNET
          
          if (pdfImages.length > 0) {
            // Use vision-capable extraction
            response = await callAnthropicPDFExtractionWithVision(prompt, pdfImages, {
              model: selectedModel,
              maxTokens: ANTHROPIC_CONTEXT_SIZES.NORMAL,
              temperature: ANTHROPIC_TEMPERATURES.LOW,
              systemPrompt: 'You are an expert resume parser and formatter. Extract resume content from PDF images and format it as clean, professional markdown that preserves all information while improving readability.'
            })
          } else {
            // Fallback to text-only extraction
            response = await callAnthropicPDFExtraction(prompt, {
              model: selectedModel,
              maxTokens: ANTHROPIC_CONTEXT_SIZES.NORMAL,
              temperature: ANTHROPIC_TEMPERATURES.LOW,
              systemPrompt: 'You are an expert resume parser and formatter. Extract resume content from PDF text and format it as clean, professional markdown that preserves all information while improving readability.'
            })
          }
        }

        const processingTime = Date.now() - startTime
        structuredData = {
          markdown: response.data.markdown,
          summary: response.data.summary,
          sections: response.data.sections,
          originalText: extractedText,
          personalInfo: response.data.personalInfo || null,
          keySkills: response.data.keySkills || [],
          experience: response.data.experience || [],
          education: response.data.education || [],
          extractionMethod: pdfImages.length > 0 ? 'vision' : 'text'
        }
        tokensUsed = response.usage.totalTokens
        estimatedCost = response.cost

        console.log('AI resume extraction completed successfully')
        console.log('Extraction method:', pdfImages.length > 0 ? 'VISION' : 'TEXT')
        console.log('Processing time:', processingTime, 'ms')
        console.log('Tokens used:', tokensUsed)
        console.log('Cost:', estimatedCost)

        // Log AI response
        await LLMLogger.logMessage({
          llmCallId,
          role: MessageRole.assistant,
          content: JSON.stringify(structuredData),
          messageIndex: 1,
          totalTokens: tokensUsed,
          costUsd: estimatedCost,
          processingTimeMs: processingTime
        })

        // Update LLM call as completed
        await LLMLogger.updateLlmCall({
          llmCallId,
          status: 'COMPLETED',
          totalTokens: tokensUsed,
          totalCostUsd: estimatedCost,
          totalProcessingTimeMs: processingTime,
          completedAt: new Date()
        })

        // Deduct credits for successful model usage
        if (affordability) {
          try {
            const selectedModel = model || (provider === 'openai' ? OPENAI_MODELS.MINI : ANTHROPIC_MODELS.SONNET)
            await UserService.deductModelCredits(userId!, selectedModel)
            console.log(`Successfully deducted ${affordability.creditCost} credits for model ${selectedModel}`)
          } catch (creditError) {
            console.error('Failed to deduct credits:', creditError)
            // Log the error but don't fail the request since the extraction was successful
          }
        }

      } catch (aiError) {
        console.error('AI extraction failed:', aiError)
        
        // Update LLM call with error if we have an ID
        if (llmCallId) {
          await LLMLogger.updateLlmCall({
            llmCallId,
            status: 'FAILED',
            errorMessage: aiError instanceof Error ? aiError.message : 'Unknown error'
          })
        }
        
        // Continue with basic extraction
        console.log('Falling back to basic extraction...')
      }
    }

    const extractedData = {
      text: extractedText,
      structuredData: structuredData,
      pages: pdfImages.length || 1,
      wordCount: extractedText.split(/\s+/).length,
      aiProvider: useAI && structuredData ? provider : 'basic-extraction',
      summary: structuredData ? structuredData.summary : 'Resume content extracted using basic PDF parsing',
      sections: structuredData ? structuredData.sections : ['Resume Content'],
      tokensUsed,
      estimatedCost,
      extractionMethod: structuredData?.extractionMethod || 'basic',
      hasImages: pdfImages.length > 0,
      imageCount: pdfImages.length
    }

    // Save resume to database
    let savedResume = existingResume
    if (!savedResume) {
      savedResume = await ResumeService.create({
        userId: userId || undefined,
        filename: file.name,
        fileHash: fileHash,
        mimeType: file.type,
        images: pdfImages,
        metadata: {
          originalSize: file.size,
          extractionMethod: useAI ? 'ai' : 'basic'
        }
      })
    }

    // Ensure we have a saved resume
    if (!savedResume) {
      throw new Error('Failed to create or find resume record')
    }

    // Save extracted data
    const cacheKey = `${fileHash}-${extractionMethod}-${useAI ? `${provider}-${model || 'default'}` : 'basic'}`
    const resumeContentHash = crypto.createHash('sha256').update(cacheKey).digest('hex')
    
    // If bypassing cache, delete existing extracted data first
    if (bypassCache && existingResume) {
      const existingExtracted = await ExtractedResumeService.findByHash(resumeContentHash)
      if (existingExtracted) {
        console.log(`🗑️ BYPASS CACHE: Deleting existing extracted data for fresh extraction`)
        await ExtractedResumeService.delete(existingExtracted.id)
      }
    }
    
    const savedExtracted = await ExtractedResumeService.create({
      resumeId: savedResume.id,
      contentHash: resumeContentHash,
      data: extractedData
    })

    const resultData: ExtractedResumeData = {
      text: extractedText,
      structuredData: structuredData,
      resumeId: savedResume.id,
      extractedResumeId: savedExtracted.id,
      metadata: {
        pages: extractedData.pages,
        wordCount: extractedData.wordCount,
        fileName: file.name,
        fileSize: file.size,
        extractedAt: new Date().toISOString(),
        aiProvider: extractedData.aiProvider,
        fromCache: false,
        tokensUsed,
        estimatedCost
      }
    }

    console.log('=== PDF AI Extraction Completed Successfully ===')

    return NextResponse.json({
      success: true,
      data: resultData,
      summary: extractedData.summary,
      sections: extractedData.sections,
      images: pdfImages,
      fromCache: false,
      resumeId: savedResume.id,
      extractedResumeId: savedExtracted.id,
      fileHash: fileHash,
      estimatedCost: estimatedCost,
      tokensUsed: tokensUsed,
      llmCallId: llmCallId,
      extractionMethod: extractedData.extractionMethod,
      hasImages: extractedData.hasImages,
      imageCount: extractedData.imageCount
    })

  } catch (error) {
    console.error('PDF AI extraction error:', error)
    
    // Update LLM call with error if we have an ID
    if (llmCallId) {
      await LLMLogger.updateLlmCall({
        llmCallId,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to extract PDF content',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
} 