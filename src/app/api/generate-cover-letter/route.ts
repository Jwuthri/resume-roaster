import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, UserService } from '@/lib/database'
import { getOrCreateJobSummary, shouldSummarizeJobDescription } from '@/lib/job-summary-utils'
import { checkCachedCoverLetter, saveCoverLetterToCache } from '@/lib/cache-utils'
import { callOpenAIText, CONTEXT_SIZES, TEMPERATURES } from '@/lib/openai-utils'
import { callAnthropicText, ANTHROPIC_MODELS } from '@/lib/anthropic-utils'
import { OPENAI_MODELS } from '@/lib/constants'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { resumeData, jobDescription, analysisData, tone = 'professional', analysisId, llm = OPENAI_MODELS.MINI } = await request.json()

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume data and job description are required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Get user for caching
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user can afford this model
    const affordability = await UserService.checkModelAffordability(user.id, llm)
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

    // Extract key information from resume
    const resumeText = typeof resumeData === 'string' ? resumeData : 
      resumeData.text || resumeData.extractedText || JSON.stringify(resumeData)

    // Truncate resume text to prevent token overflow (roughly 2000 tokens = ~8000 characters)
    const truncatedResumeText = resumeText.length > 8000 
      ? resumeText.substring(0, 8000) + '\n\n[Resume content truncated for length...]'
      : resumeText

    console.log('=== COVER LETTER GENERATION DEBUG ===')
    console.log('Resume text length:', resumeText.length)
    console.log('Truncated resume text length:', truncatedResumeText.length)
    console.log('Job description length:', jobDescription.length)
    console.log('Analysis ID:', analysisId)
    console.log('Document ID:', resumeData.documentId)
    console.log('Resume data keys:', Object.keys(resumeData))

    // Get or create job description summary if the job description is long
    let jobSummaryData = null
    let effectiveJobDescription = jobDescription

    if (shouldSummarizeJobDescription(jobDescription, 2000)) {
      console.log('Job description is long, getting/creating summary...')
      
      try {
        jobSummaryData = await getOrCreateJobSummary(jobDescription)
        effectiveJobDescription = jobSummaryData.summary
        console.log('Using job summary:', jobSummaryData.cached ? 'cached' : 'newly generated')
        console.log('Summary length:', effectiveJobDescription.length)
      } catch (error) {
        console.error('Error getting job summary:', error)
        effectiveJobDescription = jobDescription.substring(0, 2000) + '\n\n[Job description truncated for length...]'
      }
    }

    console.log('Effective job description length:', effectiveJobDescription.length)

    // Check for cached cover letter first
    const cachedCoverLetter = await checkCachedCoverLetter(
      truncatedResumeText,
      jobSummaryData?.id || null,
      tone,
      analysisId,
      llm
    )

    if (cachedCoverLetter) {
      console.log('Found cached cover letter, returning it...')
      const processingTime = Date.now() - startTime
      
      return NextResponse.json({
        success: true,
        data: {
          ...cachedCoverLetter,
          processingTime,
          wordCount: cachedCoverLetter.coverLetter.split(' ').length
        }
      })
    }

    console.log('No cached cover letter found, generating new one...')

    // Create the cover letter prompt
    const prompt = `Generate a compelling cover letter based on the following information:

RESUME DATA:
${truncatedResumeText}

JOB DESCRIPTION:
${effectiveJobDescription.extractedText}

${analysisData ? `
ANALYSIS INSIGHTS:
- Overall Score: ${analysisData.overallScore}%
- Key Strengths: ${analysisData.strengths?.slice(0, 3).join(', ')}
- Matched Keywords: ${analysisData.keywordMatch?.matched?.slice(0, 5).join(', ')}
` : ''}

${jobSummaryData ? `
EXTRACTED JOB DETAILS:
- Company: ${jobSummaryData.companyName || 'Not specified'}
- Position: ${jobSummaryData.jobTitle || 'Not specified'}
- Location: ${jobSummaryData.location || 'Not specified'}
- Key Requirements: ${jobSummaryData.keyRequirements?.slice(0, 5).join(', ') || 'See job description'}
` : ''}

REQUIREMENTS:
1. Write a ${tone} cover letter that's 3-4 paragraphs long
2. Address the hiring manager professionally
3. Highlight relevant experience and skills from the resume
4. Show enthusiasm for the specific role and company
5. Include specific examples and achievements when possible
6. Use keywords from the job description naturally
7. End with a strong call to action
8. Keep it concise but impactful (250-400 words)

TONE: ${tone === 'professional' ? 'Professional and confident' : 
       tone === 'enthusiastic' ? 'Enthusiastic and energetic' :
       tone === 'conversational' ? 'Conversational but professional' : 'Professional'}

Generate only the cover letter content without any additional formatting or explanations.`

    console.log('Final prompt length:', prompt.length)
    console.log('Estimated tokens (rough):', Math.ceil(prompt.length / 4))
    console.log('=== END DEBUG ===')

    // Call the appropriate AI service based on selected LLM
    let aiResponse
    if (llm === ANTHROPIC_MODELS.SONNET) {
      // Use Anthropic Claude
      aiResponse = await callAnthropicText(prompt, {
        model: ANTHROPIC_MODELS.SONNET,
        maxTokens: 4000,
        temperature: 0.7,
        systemPrompt: 'You are an expert career coach and professional writer specializing in creating compelling cover letters that get results. Write cover letters that are personalized, engaging, and demonstrate clear value to employers.'
      })
    } else {
      // Use OpenAI GPT-4 Mini (default)
      aiResponse = await callOpenAIText(prompt, {
        model: OPENAI_MODELS.MINI,
        maxTokens: CONTEXT_SIZES.MINI,
        temperature: TEMPERATURES.HIGH,
        systemPrompt: 'You are an expert career coach and professional writer specializing in creating compelling cover letters that get results. Write cover letters that are personalized, engaging, and demonstrate clear value to employers.'
      })
    }

    const coverLetter = aiResponse.data
    const tokensUsed = aiResponse.usage.totalTokens
    const estimatedCost = aiResponse.cost
    const processingTime = aiResponse.processingTime

    if (!coverLetter) {
      return NextResponse.json(
        { error: 'No cover letter generated' },
        { status: 500 }
      )
    }

    // Deduct credits for successful model usage
    try {
      await UserService.deductModelCredits(user.id, llm)
      console.log(`Successfully deducted ${affordability.creditCost} credits for model ${llm}`)
    } catch (creditError) {
      console.error('Failed to deduct credits:', creditError)
      // Log the error but don't fail the request since the cover letter was generated successfully
    }

    // Store the cover letter generation in database using LlmCall
    let llmCallId = null
    try {
      // Create LLM call record
      const llmCall = await db.llmCall.create({
        data: {
          userId: user.id,
          provider: llm === ANTHROPIC_MODELS.SONNET ? 'anthropic' : 'openai',
          model: llm === ANTHROPIC_MODELS.SONNET ? ANTHROPIC_MODELS.SONNET : OPENAI_MODELS.MINI,
          operationType: 'cover_letter_generation',
          totalTokens: tokensUsed,
          totalCostUsd: estimatedCost,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      llmCallId = llmCall.id

      // Create messages for the conversation
      await db.llmMessage.create({
        data: {
          llmCallId: llmCall.id,
          role: 'user',
          content: `Generate cover letter for job:\n\n${effectiveJobDescription}\n\nUsing resume data and tone: ${tone}`,
          messageIndex: 0,
          totalTokens: Math.floor(tokensUsed * 0.8)
        }
      })

      await db.llmMessage.create({
        data: {
          llmCallId: llmCall.id,
          role: 'assistant',
          content: coverLetter,
          messageIndex: 1,
          totalTokens: Math.floor(tokensUsed * 0.2),
          costUsd: estimatedCost
        }
      })

      console.log('Cover letter generation stored in database')
    } catch (dbError) {
      console.error('Failed to store cover letter generation:', dbError)
      // Continue without failing the request
    }

    // Save to cache
    const cachedResult = await saveCoverLetterToCache(
      truncatedResumeText,
      jobSummaryData?.id || null,
      tone,
      coverLetter,
      user.id,
      analysisId,
      llm
    )

    return NextResponse.json({
      success: true,
      data: {
        coverLetter: cachedResult.content,
        tone: tone,
        wordCount: coverLetter.split(' ').length,
        cached: false,
        usageCount: 1,
        metadata: {
          tokensUsed,
          processingTime,
          estimatedCost,
          creditsDeducted: affordability.creditCost
        }
      }
    })

  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json(
      { error: 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
} 