import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'
import { LLMLogger, MessageRole } from '@/lib/llm-logger'
import { ANTHROPIC_MODELS, ANTHROPIC_CONTEXT_SIZES, ANTHROPIC_TEMPERATURES, callAnthropicResumeOptimization } from '@/lib/anthropic-utils'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  let llmCallId: string | null = null

  try {
    const session = await getServerSession(authOptions)
    
    // Resume summarization is FREE - no authentication required
    // This helps users prepare better data for analysis

    const { resumeText, resumeId, extractedResumeId, bypassCache = false } = await request.json()

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      )
    }

    // Get user from database (optional for free operation)
    let user = null
    if (session?.user?.email) {
      user = await db.user.findUnique({
        where: { email: session.user.email }
      })
    }

    console.log('Summarized resume API called')
    console.log('Resume text length:', resumeText.length)
    console.log('Resume ID:', resumeId)
    console.log('Extracted Resume ID:', extractedResumeId)
    console.log('Bypass cache:', bypassCache)

    // Generate content hash for caching
    const contentHash = crypto.createHash('sha256')
      .update(resumeText + 'summarized')
      .digest('hex')

    console.log('Content hash:', contentHash)

    // Check for existing summarized data (unless bypassing cache)
    if (!bypassCache) {
      const existingSummarized = await db.summarizedResume.findFirst({
        where: { contentHash }
      })

      if (existingSummarized) {
        console.log('Found cached summarized resume, returning it...')
        return NextResponse.json({
          success: true,
          data: existingSummarized.summary,
          cached: true,
          summarizedResumeId: existingSummarized.id,
          contentHash
        })
      }
    }

    console.log('No cached summarized resume found, generating new one...')

    // Create LLM call for logging (optional for anonymous users)
    if (user) {
      llmCallId = await LLMLogger.createLlmCall({
        userId: user.id,
        provider: 'anthropic',
        model: ANTHROPIC_MODELS.SONNET,
        operationType: 'resume_summarization',
        extractedResumeId: extractedResumeId || undefined
      })
    }

    // Create the summarization prompt
    const prompt = `Please extract and structure the following resume data into a comprehensive JSON format:

${resumeText}

Extract all relevant information including:
- Personal information (name, contact details, location)
- Professional summary/objective
- Work experience (with dates, companies, positions, responsibilities)
- Education (degrees, institutions, dates, relevant coursework)
- Skills (technical, soft skills, certifications)
- Projects, achievements, awards
- Any other relevant sections

Please use the optimize_resume_data function to return structured data that captures all information accurately.`

    if (llmCallId) {
      await LLMLogger.logMessage({
        llmCallId,
        role: MessageRole.user,
        content: prompt,
        messageIndex: 0
      })
    }

    console.log('Sending request to Anthropic for resume summarization...')

    const startTime = Date.now()

    // Use centralized Anthropic utility with function calling
    const response = await callAnthropicResumeOptimization(prompt, {
      model: ANTHROPIC_MODELS.SONNET,
      maxTokens: ANTHROPIC_CONTEXT_SIZES.NORMAL,
      temperature: ANTHROPIC_TEMPERATURES.NORMAL, // Lower temperature for more consistent extraction
      systemPrompt: 'You are an expert resume parser. Extract resume data into structured JSON format that captures all information accurately and completely. Use the provided tool to return structured data.'
    })

    const processingTime = Date.now() - startTime
    const summarizedData = response.data
    const tokensUsed = response.usage.totalTokens
    const estimatedCost = response.cost

    console.log('Resume summarization completed successfully')
    console.log('Processing time:', processingTime, 'ms')
    console.log('Tokens used:', tokensUsed)
    console.log('Cost:', estimatedCost)

    // Log AI response (only if we have an llmCallId)
    if (llmCallId) {
      await LLMLogger.logMessage({
        llmCallId,
        role: MessageRole.assistant,
        content: JSON.stringify(summarizedData),
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
    }

    // Save summarized data
    const savedSummarized = await db.summarizedResume.create({
      data: {
        extractedResumeId: extractedResumeId || crypto.randomUUID(),
        contentHash,
        summary: summarizedData
      }
    })

    return NextResponse.json({
      success: true,
      data: summarizedData,
      cached: false,
      summarizedResumeId: savedSummarized.id,
      contentHash,
      metadata: {
        tokensUsed,
        processingTime,
        estimatedCost
      }
    })

  } catch (error) {
    console.error('Resume summarization error:', error)
    
    // Update LLM call with error if we have an ID
    if (llmCallId) {
      await LLMLogger.updateLlmCall({
        llmCallId,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to summarize resume' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // GET is also free, but only return data for authenticated users
    if (!session?.user?.email) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      })
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's summarized resumes through extractedResume relation
    const summarizedResumes = await db.summarizedResume.findMany({
      where: { 
        extractedResume: {
          resume: {
            userId: user.id
          }
        }
      },
      include: {
        extractedResume: {
          include: {
            resume: {
              select: {
                id: true,
                filename: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await db.summarizedResume.count({
      where: {
        extractedResume: {
          resume: {
            userId: user.id
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: summarizedResumes,
      pagination: {
        total: totalCount,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Get summarized resumes error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summarized resumes' },
      { status: 500 }
    )
  }
} 