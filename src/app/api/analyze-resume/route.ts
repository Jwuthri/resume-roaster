import { NextRequest, NextResponse } from 'next/server'
import { LLMLogger, MessageRole } from '@/lib/llm-logger'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, GeneratedRoastService } from '@/lib/database'
import crypto from 'crypto'
import { callAnthropicResumeAnalysis } from '@/lib/anthropic-utils'
import { callOpenAIResumeAnalysis } from '@/lib/openai-utils'
import { ANTHROPIC_MODELS, OPENAI_MODELS } from '@/lib/constants'

const ANALYSIS_PROMPT = `You are an expert resume reviewer and career coach. Your task is to analyze a resume against a specific job description and provide brutally honest, actionable feedback.

You will be given:
1. A resume in markdown format
2. A job description

**Your Analysis Framework:**

**CRITICAL SCORING INSTRUCTION**: Use the FULL range of scores from 0-100. Do NOT default to safe middle scores. Be bold and precise in your assessment. Most resumes fall between 45-85, not all at 72!

## 1. DETAILED SCORING RUBRIC (0-100)

Calculate the score using this EXACT methodology:

### Skills Match (40 points max)
Start with 40 points and deduct:
- Missing each required skill: -5 points
- Missing preferred skills: -2 points each
- Outdated skill versions: -3 points each
- No evidence of skill proficiency: -3 points each
**Minimum: 0 points**

### Experience Relevance (35 points max)
Start with 35 points and adjust:
- Perfect role match: Keep 35
- Similar role, different industry: -5 to -12
- Different role, similar skills: -12 to -18
- Entry-level for senior position: -25
- Years of experience gap: -3 per year short
**Minimum: 0 points**

### Achievement Alignment (20 points max)
Start with 0 and add:
- Each quantified achievement relevant to JD: +4
- Each achievement without metrics: +2
- Generic responsibilities only: +0
- Maximum 20 points

### Presentation Quality (5 points max)
Start with 5 and deduct:
- Poor formatting: -2
- Typos/grammar errors: -1 per error
- Missing key sections: -1 each
- Wall of text/poor readability: -2
**IMPORTANT: Minimum score is 0 points (never negative)**

**SCORE CALIBRATION EXAMPLES**:
- 95: Fortune 500 exec applying to similar role, perfect match
- 82: Strong candidate, 2-3 minor gaps, well-presented
- 68: Decent fit but missing 30% of requirements
- 55: Career changer with transferable skills
- 40: Major gaps, needs significant work
- 25: Wrong fit entirely

**scoreJustification**:
- Please provide a clear, well-written explanation justifying the score you assigned. Your justification should:
- Be detailed and thoughtful, clearly explaining the reasons behind the score
- Use Markdown formatting for readability
  - Include relevant emojis to enhance engagement and clarity
- Aim for a professional yet friendly tone!

## 2. DETAILED ANALYSIS

### Strengths (3-5 points)
Highlight exceptional elements that give competitive advantage

### Critical Weaknesses (3-7 points)
Be brutally honest about:
- Missing must-have qualifications (list each one)
- Weak/generic content (quote specific examples)
- Poor achievement quantification
- Formatting/structural issues
- Red flags (gaps, job hopping, etc.)

### Suggestions
Provide specific, actionable fixes with examples:
- What to remove/add/rewrite
- Exact phrasing suggestions where helpful
- Quantification opportunities missed

### Keyword Optimization
- **Power keywords present**: Industry terms, skills, tools from JD
- **Critical missing keywords**: Must-add for ATS and human readers
- **Keyword density**: Over/under-optimized sections
- **Match percentage**: X out of Y critical keywords found

### ATS Compatibility Check
- Formatting issues (tables, images, headers)
- Missing standard sections
- Problematic characters or fonts
- File format concerns

### Industry-Specific Considerations
Note any industry norms being violated or opportunities missed

**RESPONSE DIVERSITY REQUIREMENTS**:
- Vary your language - don't use the same phrases repeatedly
- Provide specific examples from the resume (quote actual text)
- Include numbers and percentages where relevant
- Give time estimates for improvements
- Compare to typical candidates for this role
- Consider industry-specific nuances

**ACTIONABILITY REQUIREMENTS**:
- Every weakness must have a specific solution
- Include before/after examples for bullet points
- Suggest exact keywords and where to place them
- Prioritize changes by ROI (impact vs. effort)
- Include quick wins that take <5 minutes

**COMPETITIVE CONTEXT**:
- Consider this resume against typical applicant pool
- Identify unique differentiators
- Highlight what would make recruiter pause (good or bad)
- Suggest ways to stand out from other candidates

Be direct, honest, and constructive.`

export async function POST(request: NextRequest) {
  let llmCallId: string | null = null

  try {
    const { resumeData, jobDescription, analysisName, extractedJobId, summarizedResumeId, selectedLLM } = await request.json()

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume data and job description are required' },
        { status: 400 }
      )
    }

    // Validate selected LLM
    const validModels = [...Object.values(OPENAI_MODELS), ...Object.values(ANTHROPIC_MODELS)]
    const modelToUse = selectedLLM && validModels.includes(selectedLLM) ? selectedLLM : ANTHROPIC_MODELS.SONNET

    console.log('Starting resume analysis...')
    console.log('Selected LLM:', modelToUse)
    console.log('Extracted Job ID:', extractedJobId)
    console.log('Summarized Resume ID:', summarizedResumeId)

    // Get user session for logging
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Generate analysis title
    let analysisTitle = analysisName?.trim() || `Analysis ${Date.now()}`

    // For analysis, we should use the original resume content to properly evaluate presentation
    // The summarized data is JSON and won't give accurate presentation scoring
    let resumeContent = ''
    if (summarizedResumeId) {
      console.log('Found summarized resume, but using original content for analysis')
    }
    
    // Always use original resume content for proper presentation scoring
    resumeContent = typeof resumeData === 'string' ? resumeData : 
                   resumeData.text || resumeData.extractedText || JSON.stringify(resumeData)

    // Fetch summarized job description if extractedJobId is provided
    let jobContent = jobDescription
    if (extractedJobId) {
      console.log('Fetching summarized job description...')
      try {
        const summarizedJob = await db.summarizedJobDescription.findFirst({
          where: { extractedJobId: extractedJobId }
        })
        
        if (summarizedJob && summarizedJob.summary) {
          // Use the AI-generated summary
          jobContent = typeof summarizedJob.summary === 'string' 
            ? summarizedJob.summary 
            : JSON.stringify(summarizedJob.summary, null, 2)
          console.log('Using summarized job description')
        } else {
          console.warn('Summarized job description not found, using original')
          jobContent = jobDescription
        }
      } catch (error) {
        console.error('Error fetching summarized job description:', error)
        jobContent = jobDescription
      }
    }

    console.log('Resume content length:', resumeContent.length)
    console.log('Job content length:', jobContent.length)

    // Determine provider based on model
    const isAnthropicModel = Object.values(ANTHROPIC_MODELS).includes(modelToUse as any)
    const provider = isAnthropicModel ? 'anthropic' : 'openai'

    // Create LLM call for logging
    llmCallId = await LLMLogger.createLlmCall({
      userId: userId ?? undefined,
      provider,
      model: modelToUse,
      operationType: 'resume_analysis',
      resumeId: resumeData.resumeId || undefined,
      extractedJobId: extractedJobId || undefined
    })

    const userPrompt = `Please analyze this resume against the job description:

**RESUME:**
${resumeContent}

**JOB DESCRIPTION:**
${jobContent}

Please provide a comprehensive analysis following the framework above.`

    await LLMLogger.logMessage({
      llmCallId,
      role: MessageRole.user,
      content: userPrompt,
      messageIndex: 0
    })

    console.log(`Sending request to ${provider.toUpperCase()}...`)

    const startTime = Date.now()
    
    let response: any
    if (isAnthropicModel) {
      response = await callAnthropicResumeAnalysis(userPrompt, {
        model: modelToUse,
        systemPrompt: ANALYSIS_PROMPT,
        maxTokens: 4000,
        temperature: 0.3
      })
    } else {
      response = await callOpenAIResumeAnalysis(userPrompt, {
        model: modelToUse,
        systemPrompt: ANALYSIS_PROMPT,
        maxTokens: 4000,
        temperature: 0.3
      })
    }

    const processingTime = Date.now() - startTime

    // Extract analysis data from response
    const analysisData = response.data
    
    // Calculate costs and tokens
    const inputTokens = isAnthropicModel ? response.usage.inputTokens : response.usage.promptTokens
    const outputTokens = isAnthropicModel ? response.usage.outputTokens : response.usage.completionTokens
    const totalTokens = inputTokens + outputTokens
    const totalCost = response.cost

    // Log AI response
    await LLMLogger.logMessage({
      llmCallId,
      role: MessageRole.assistant,
      content: JSON.stringify(analysisData),
      messageIndex: 1,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd: totalCost,
      processingTimeMs: processingTime,
      finishReason: isAnthropicModel ? response.stopReason : response.finishReason,
      temperature: 0.3,
      maxTokens: 4000
    })
    
    // Validate required fields
    if (!analysisData.overallScore || !analysisData.strengths || !analysisData.weaknesses) {
      // Update LLM call with error
      await LLMLogger.updateLlmCall({
        llmCallId,
        status: 'FAILED',
        errorMessage: 'Invalid analysis format returned by AI - missing required fields',
        totalTokens,
        totalCostUsd: totalCost
      })
      
      return NextResponse.json(
        { error: 'Invalid analysis format returned by AI. Missing required fields.' },
        { status: 500 }
      )
    }

    // Update LLM call as completed
    await LLMLogger.updateLlmCall({
      llmCallId,
      status: 'COMPLETED',
      totalTokens,
      totalCostUsd: totalCost,
      totalProcessingTimeMs: processingTime,
      completedAt: new Date()
    })

    console.log(`Analysis completed with score: ${analysisData.overallScore}`)

    // Save analysis as a generated roast
    const contentHash = crypto.createHash('sha256')
      .update(resumeContent + jobContent + JSON.stringify(analysisData))
      .digest('hex')

    const roastRecord = await GeneratedRoastService.create({
      userId: userId ?? undefined,
      resumeId: resumeData.resumeId || undefined,
      extractedResumeId: resumeData.extractedResumeId || undefined,
      extractedJobId: extractedJobId || undefined,
      contentHash,
      data: analysisData,
      overallScore: analysisData.overallScore
    })

    console.log(`Analysis saved with ID: ${roastRecord.id}`)

    return NextResponse.json({
      success: true,
      analysis: analysisData,
      llmCallId,
      roastId: roastRecord.id,
      metadata: {
        totalTokens,
        totalCost,
        processingTime,
        provider,
        model: modelToUse
      }
    })

  } catch (error) {
    console.error('Resume analysis error:', error)
    
    // Update LLM call with error if we have an ID
    if (llmCallId) {
      await LLMLogger.updateLlmCall({
        llmCallId,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please check your API keys.' },
          { status: 500 }
        )
      }
      
      if (error.message.includes('rate limit') || error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'AI service rate limit reached. Please try again later.' },
          { status: 429 }
        )
      }

      if (error.message.includes('overloaded') || error.message.includes('500')) {
        return NextResponse.json(
          { error: 'AI service is temporarily overloaded. Please try again in a moment.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze resume. Please try again.' },
      { status: 500 }
    )
  }
} 