import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { JobDescriptionService } from '@/lib/database'
import { callOpenAIJobSummary, OPENAI_MODELS, CONTEXT_SIZES, TEMPERATURES } from '@/lib/openai-utils'
import { LLMLogger, MessageRole } from '@/lib/llm-logger'
import crypto from 'crypto'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  let llmCallId: string | null = null

  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    const { jobDescription } = await request.json()

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      )
    }

    console.log('Processing job description...')
    console.log('Job description length:', jobDescription.length)

    // Generate content hash for deduplication
    const jobDescriptionHash = crypto.createHash('sha256')
      .update(jobDescription.trim())
      .digest('hex')

    // Check if job description already exists
    const existingJobDescription = await JobDescriptionService.findByHash(jobDescriptionHash)
    
    let jobDescriptionRecord: NonNullable<typeof existingJobDescription>
    
    if (existingJobDescription) {
      console.log(`Using existing job description with ID: ${existingJobDescription.id}`)
      
      // Check if we already have a summary for this job description
      const existingSummary = await db.summarizedJobDescription.findFirst({
        where: { extractedJobId: existingJobDescription.id }
      })

      // If we have both job description AND summary, return from cache
      if (existingSummary) {
        return NextResponse.json({
          success: true,
          extractedJobId: existingJobDescription.id,
          summarizedJobId: existingSummary.id,
          fromCache: true
        })
      }
      
      // If we have job description but no summary, continue to generate summary
      console.log(`Job description exists but no summary found. Generating summary for job ID: ${existingJobDescription.id}`)
      jobDescriptionRecord = existingJobDescription
    } else {
      // Save the job description to ExtractedJobDescription table
      jobDescriptionRecord = await JobDescriptionService.create({
        userId: userId || undefined,
        contentHash: jobDescriptionHash,
        originalText: jobDescription.trim(),
        data: {
          originalText: jobDescription.trim(),
          extractedAt: new Date().toISOString(),
          wordCount: jobDescription.trim().split(/\s+/).length,
          characterCount: jobDescription.trim().length
        }
      })

      console.log(`Job description saved with ID: ${jobDescriptionRecord.id}`)
    }

    // Create LLM call for job description summarization
    llmCallId = await LLMLogger.createLlmCall({
      userId: userId || undefined,
      provider: 'openai',
      model: OPENAI_MODELS.MINI, // Use OpenAI mini model for summarization
      operationType: 'job_summarization',
      extractedJobId: jobDescriptionRecord.id
    })

    // Create job description summary using AI
    const summaryPrompt = `Please analyze and summarize this job description for resume optimization purposes:

JOB DESCRIPTION:
${jobDescription.trim()}

Please extract and organize the following information:

1. **Key Requirements** (must-have skills, experience, qualifications, degree, etc.)
2. **Preferred Qualifications** (nice-to-have skills and experience)
3. **Core Responsibilities** (main duties and tasks)
4. **Company Culture & Values** (if mentioned)
5. **Keywords for ATS** (important terms that should appear in a resume)

Format your response as a structured summary that will help optimize a resume for this position.`

    await LLMLogger.logMessage({
      llmCallId,
      role: MessageRole.user,
      content: summaryPrompt,
      messageIndex: 0
    })

    console.log('Generating job description summary...')

    const startTime = Date.now()
    const summaryResponse = await callOpenAIJobSummary(summaryPrompt, {
      model: OPENAI_MODELS.MINI,
      maxTokens: CONTEXT_SIZES.NORMAL,
      temperature: TEMPERATURES.NORMAL
    })

    const processingTime = Date.now() - startTime
    const summary = summaryResponse.data.summary
    const tokensUsed = summaryResponse.usage.totalTokens
    const estimatedCost = summaryResponse.cost

    // Log AI response
    await LLMLogger.logMessage({
      llmCallId,
      role: MessageRole.assistant,
      content: summary,
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

    // Save the summary to SummarizedJobDescription table
    const summaryHash = crypto.createHash('sha256')
      .update(summary)
      .digest('hex')

    const summaryRecord = await db.summarizedJobDescription.create({
      data: {
        extractedJobId: jobDescriptionRecord.id,
        contentHash: summaryHash,
        summary: summary
      }
    })

    console.log(`Job description summary saved with ID: ${summaryRecord.id}`)

    return NextResponse.json({
      success: true,
      extractedJobId: jobDescriptionRecord.id,
      summarizedJobId: summaryRecord.id,
      summary: summary,
      fromCache: false,
      metadata: {
        tokensUsed,
        estimatedCost,
        processingTime
      }
    })

  } catch (error) {
    console.error('Job description processing error:', error)
    
    // Update LLM call with error if we have an ID
    if (llmCallId) {
      await LLMLogger.updateLlmCall({
        llmCallId,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to process job description' },
      { status: 500 }
    )
  }
} 