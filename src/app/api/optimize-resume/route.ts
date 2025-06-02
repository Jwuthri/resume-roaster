import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, UserService } from '@/lib/database'
import { LLMLogger, MessageRole } from '@/lib/llm-logger'
import { ANTHROPIC_MODELS, ANTHROPIC_CONTEXT_SIZES, ANTHROPIC_TEMPERATURES, callAnthropicResumeOptimization } from '@/lib/anthropic-utils'
import { callOpenAIText, callOpenAIResumeOptimization, CONTEXT_SIZES, TEMPERATURES } from '@/lib/openai-utils'
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

    const { 
      roastId,
      bypassCache = false,
      llm = OPENAI_MODELS.MINI // Default to MINI if not specified
    } = await request.json()

    if (!roastId) {
      return NextResponse.json(
        { error: 'Roast ID is required' },
        { status: 400 }
      )
    }

    console.log('=== OPTIMIZE RESUME DEBUG ===')
    console.log('Roast ID:', roastId)
    console.log('Selected LLM:', llm)
    console.log('Bypass cache:', bypassCache)

    // Get user from database
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

    // Fetch the analysis with all related data
    const analysis = await db.generatedRoast.findUnique({
      where: { 
        id: roastId,
        userId: user.id // Ensure user owns this analysis
      },
      include: {
        extractedJob: {
          include: {
            summarizedJobDescriptions: true
          }
        },
        extractedResume: {
          include: {
            summarizedResumes: true
          }
        }
      }
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      )
    }

    console.log('Found analysis with extracted job:', !!analysis.extractedJob)
    console.log('Found analysis with extracted resume:', !!analysis.extractedResume)
    console.log('Extracted Resume ID:', analysis.extractedResumeId)
    console.log('Extracted Job ID:', analysis.extractedJobId)

    // Debug: Log what data is actually available
    console.log('=== ANALYSIS DATA DEBUG ===')
    if (analysis.extractedResume) {
      console.log('ExtractedResume exists')
      console.log('ExtractedResume has data:', !!analysis.extractedResume.data)
      console.log('ExtractedResume summarizedResumes count:', analysis.extractedResume.summarizedResumes?.length || 0)
    } else {
      console.log('No ExtractedResume found')
    }
    
    if (analysis.extractedJob) {
      console.log('ExtractedJob exists')
      console.log('ExtractedJob has data:', !!analysis.extractedJob.data)
      console.log('ExtractedJob has originalText:', !!analysis.extractedJob.originalText)
      console.log('ExtractedJob summarizedJobDescriptions count:', analysis.extractedJob.summarizedJobDescriptions?.length || 0)
    } else {
      console.log('No ExtractedJob found')
    }
    
    console.log('Analysis data keys:', analysis.data ? Object.keys(analysis.data as any) : 'No analysis.data')
    console.log('=== END DEBUG ===')

    // Get summarized resume data with fallback logic
    let resumeContent = ''
    
    // Try to get summarized resume data first
    if (analysis.extractedResume && analysis.extractedResume.summarizedResumes && analysis.extractedResume.summarizedResumes.length > 0) {
      const summarizedResume = analysis.extractedResume.summarizedResumes[0]
      resumeContent = typeof summarizedResume.summary === 'string' 
        ? summarizedResume.summary 
        : JSON.stringify(summarizedResume.summary, null, 2)
      console.log('Using summarized resume data')
    } 
    // Fallback 1: Try to get extracted resume data directly
    else if (analysis.extractedResume && analysis.extractedResume.data) {
      resumeContent = typeof analysis.extractedResume.data === 'string' 
        ? analysis.extractedResume.data 
        : JSON.stringify(analysis.extractedResume.data, null, 2)
      console.log('Using extracted resume data as fallback')
    }
    // Fallback 2: Try to extract resume content from the analysis data itself
    else if (analysis.data && typeof analysis.data === 'object') {
      // The analysis data might contain the original resume content
      const analysisData = analysis.data as any
      if (analysisData.resumeContent || analysisData.resume) {
        resumeContent = analysisData.resumeContent || analysisData.resume
        console.log('Using resume content from analysis data')
      } else {
        // Last resort: use the analysis data as a string representation
        resumeContent = JSON.stringify(analysis.data, null, 2)
        console.log('Using analysis data as resume content fallback')
      }
    } else {
      return NextResponse.json(
        { error: 'No resume data found for this analysis. Please try creating a new analysis.' },
        { status: 400 }
      )
    }

    // Get summarized job description with fallback logic
    let jobContent = ''
    
    // Try to get summarized job description first
    if (analysis.extractedJob && analysis.extractedJob.summarizedJobDescriptions && analysis.extractedJob.summarizedJobDescriptions.length > 0) {
      const summarizedJob = analysis.extractedJob.summarizedJobDescriptions[0]
      jobContent = typeof summarizedJob.summary === 'string' 
        ? summarizedJob.summary 
        : JSON.stringify(summarizedJob.summary, null, 2)
      console.log('Using summarized job description')
    } 
    // Fallback 1: Try to get extracted job data directly
    else if (analysis.extractedJob && analysis.extractedJob.data) {
      jobContent = typeof analysis.extractedJob.data === 'string' 
        ? analysis.extractedJob.data 
        : JSON.stringify(analysis.extractedJob.data, null, 2)
      console.log('Using extracted job data as fallback')
    }
    // Fallback 2: Try to get original job text
    else if (analysis.extractedJob && analysis.extractedJob.originalText) {
      jobContent = analysis.extractedJob.originalText
      console.log('Using original job text as fallback')
    }
    // Fallback 3: Try to extract job content from the analysis data itself
    else if (analysis.data && typeof analysis.data === 'object') {
      const analysisData = analysis.data as any
      if (analysisData.jobContent || analysisData.jobDescription) {
        jobContent = analysisData.jobContent || analysisData.jobDescription
        console.log('Using job content from analysis data')
      } else {
        // If we can't find job content, we can't optimize
        return NextResponse.json(
          { error: 'No job description data found for this analysis. Please try creating a new analysis.' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'No job description data found for this analysis. Please try creating a new analysis.' },
        { status: 400 }
      )
    }

    // Generate content hash for deduplication - include roast ID and LLM to ensure uniqueness per analysis and model
    const contentHash = crypto.createHash('sha256')
      .update(resumeContent + jobContent + roastId + llm)
      .digest('hex')

    console.log('Content hash for analysis:', roastId, 'with LLM:', llm, 'is:', contentHash)

    // Check for existing optimized resume (unless bypassing)
    if (!bypassCache) {
      const existingResume = await db.generatedResume.findFirst({
        where: {
          userId: user.id,
          contentHash: contentHash,
          // Link to the specific analysis components
          extractedResumeId: analysis.extractedResumeId,
          extractedJobId: analysis.extractedJobId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (existingResume) {
        console.log('Returning existing optimized resume from database for analysis:', roastId)
        
        return NextResponse.json({
          success: true,
          content: existingResume.content,
          data: existingResume.data,
          cached: true,
          resumeId: existingResume.id,
          metadata: {
            atsScore: existingResume.atsScore || 85,
            keywordsMatched: existingResume.keywordsMatched || [],
            optimizationSuggestions: ['Resume retrieved from cache'],
            fromDatabase: true,
            analysisId: roastId
          }
        })
      }
    }

    console.log('No existing optimized resume found, generating new one...')

    // Create the optimization prompt
    const prompt = `You are an expert resume optimizer focused on creating CONCISE, impactful resumes. Create an optimized resume based on the following structured data:

SUMMARIZED RESUME DATA:
${resumeContent}

SUMMARIZED JOB DESCRIPTION:
${jobContent}

CRITICAL REQUIREMENTS - FOLLOW STRICTLY:
1. BE EXTREMELY CONCISE - Each bullet point should be 1 line maximum
2. Use QUANTIFIED achievements with specific numbers/percentages when possible
3. Limit job descriptions to 2 bullet points per role
4. Professional summary should be 1-2 sentences maximum
5. Skills section should list only the most relevant 4-8 technical skills
6. ALWAYS include 3-5 relevant soft skills (Leadership, Communication, Problem-solving, etc.)
7. Focus on IMPACT and RESULTS, not job duties
8. Use strong action verbs (Led, Increased, Reduced, Implemented, etc.)
9. Match job keywords naturally but don't stuff them
10. Prioritize recent and relevant experience
11. Remove fluff words and unnecessary details
12. MANDATORY: Include both "achievements" and "description" arrays for each experience entry
13. MANDATORY: Include "soft" skills array in the skills section

STRUCTURE GUIDELINES:
- Summary: 2-3 sentences highlighting key value proposition
- Experience: Each role MUST have both "description" (1-2 bullets) AND "achievements" (1-2 bullets with quantified results)
- Skills: MUST include "technical", "soft", and "languages" arrays
- Soft skills: Include relevant interpersonal skills like Leadership, Communication, Problem-solving, Team Collaboration, etc.
- Keep total content suitable for 1-2 pages resume

MANDATORY FIELDS TO INCLUDE:
- skills.soft: Array of 3-5 relevant soft skills
- experience[].achievements: Array of quantified accomplishments for each role
- experience[].description: Array of concise job responsibilities

Please use the optimize_resume_data function to return the structured optimization result with CONCISE, impactful content that includes ALL required fields.`

    console.log('Optimization prompt length:', prompt.length)

    // Use the selected AI service based on the LLM parameter
    let response
    let optimizedData
    let processingTime
    let tokensUsed
    let estimatedCost

    // Determine if we're using Anthropic or OpenAI based on the model
    const isAnthropicModel = llm.includes('claude')
    
    if (isAnthropicModel) {
      // Use Anthropic Claude with function calling
      response = await callAnthropicResumeOptimization(prompt, {
        model: llm, // Use the selected Anthropic model
        maxTokens: ANTHROPIC_CONTEXT_SIZES.NORMAL,
        temperature: ANTHROPIC_TEMPERATURES.NORMAL,
        systemPrompt: 'You are an expert resume optimizer specializing in CONCISE, high-impact resumes. Create optimized resume content that is brief, quantified, and tailored to specific job requirements. Prioritize brevity and impact over lengthy descriptions. Use the provided tool to return structured optimization results with concise content.'
      })
      
      optimizedData = response.data
      processingTime = response.processingTime
      tokensUsed = response.usage.totalTokens
      estimatedCost = response.cost
    } else {
      // Use OpenAI GPT with function calling
      const openAIResponse = await callOpenAIResumeOptimization(prompt, {
        model: llm, // Use the selected OpenAI model
        maxTokens: CONTEXT_SIZES.NORMAL,
        temperature: TEMPERATURES.NORMAL,
        systemPrompt: 'You are an expert resume optimizer specializing in CONCISE, high-impact resumes. Create optimized resume content that is brief, quantified, and tailored to specific job requirements. Prioritize brevity and impact over lengthy descriptions. Use the provided tool to return structured optimization results with concise content.'
      })
      
      // Function calling returns structured data directly
      optimizedData = openAIResponse.data
      processingTime = openAIResponse.processingTime
      tokensUsed = openAIResponse.usage.totalTokens
      estimatedCost = openAIResponse.cost
    }

    console.log('Resume optimization completed successfully')
    console.log('Processing time:', processingTime, 'ms')
    console.log('Tokens used:', tokensUsed)

    // Deduct credits for successful model usage
    try {
      await UserService.deductModelCredits(user.id, llm)
      console.log(`Successfully deducted ${affordability.creditCost} credits for model ${llm}`)
    } catch (creditError) {
      console.error('Failed to deduct credits:', creditError)
      // Log the error but don't fail the request since the optimization was successful
    }

    // Calculate ATS score and extract keywords
    const atsScore = calculateATSScore(optimizedData, jobContent)
    const keywordsMatched = extractKeywordsMatched(optimizedData, jobContent)

    // Generate optimized resume content (HTML)
    const optimizedContent = generateOptimizedResumeContent(optimizedData)

    // Store the optimization in database
    let llmCallId = null
    let generatedResumeId = null
    
    try {
      // Create LLM call record
      const llmCall = await db.llmCall.create({
        data: {
          userId: user.id,
          provider: isAnthropicModel ? 'anthropic' : 'openai',
          model: llm,
          operationType: 'resume_optimization',
          totalTokens: tokensUsed,
          totalCostUsd: estimatedCost,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      llmCallId = llmCall.id

      // Create messages for the call
      await db.llmMessage.create({
        data: {
          llmCallId: llmCall.id,
          role: 'user',
          content: prompt,
          messageIndex: 0,
          totalTokens: Math.floor(tokensUsed * 0.8) // Estimate input tokens
        }
      })

      await db.llmMessage.create({
        data: {
          llmCallId: llmCall.id,
          role: 'assistant',
          content: JSON.stringify(optimizedData),
          messageIndex: 1,
          totalTokens: Math.floor(tokensUsed * 0.2) // Estimate output tokens
        }
      })

      // Save the optimized resume to database
      const generatedResume = await db.generatedResume.create({
        data: {
          userId: user.id,
          templateId: 'optimized-content', // Generic identifier for optimized content
          contentHash: contentHash,
          content: optimizedContent,
          data: optimizedData,
          atsScore: atsScore,
          keywordsMatched: keywordsMatched,
          roastId: roastId,
          extractedResumeId: analysis.extractedResumeId,
          extractedJobId: analysis.extractedJobId
        }
      })

      generatedResumeId = generatedResume.id

      console.log('✅ Resume optimization saved to database with links:')
      console.log('   - Generated Resume ID:', generatedResumeId)
      console.log('   - Roast ID:', roastId)
      console.log('   - Extracted Resume ID:', analysis.extractedResumeId)
      console.log('   - Extracted Job ID:', analysis.extractedJobId)
      console.log('   - Content Hash:', contentHash)
    } catch (dbError) {
      console.error('Failed to store resume optimization:', dbError)
      // Continue without failing the request
    }

    return NextResponse.json({
      success: true,
      content: optimizedContent,
      data: optimizedData,
      cached: false,
      resumeId: generatedResumeId,
      metadata: {
        tokensUsed,
        processingTime,
        estimatedCost,
        atsScore,
        keywordsMatched,
        optimizationSuggestions: optimizedData.suggestions || ['Resume optimized for target job'],
        llmCallId,
        creditsDeducted: affordability.creditCost
      }
    })

  } catch (error) {
    console.error('Error optimizing resume:', error)
    return NextResponse.json(
      { error: 'Failed to optimize resume' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateATSScore(optimizedData: any, jobDescription: string): number {
  // Simple ATS score calculation based on optimization quality
  let score = 0
  
  // Check for structured content
  if (optimizedData.personalInfo?.name) score += 10
  if (optimizedData.personalInfo?.email) score += 10
  if (optimizedData.summary) score += 15
  if (optimizedData.experience?.length > 0) score += 20
  if (optimizedData.skills?.length > 0) score += 15
  
  // Check for job-specific optimization
  if (optimizedData.keywordOptimization) score += 15
  if (optimizedData.achievements?.length > 0) score += 15
  
  return Math.min(score, 100)
}

function extractKeywordsMatched(optimizedData: any, jobDescription: string): string[] {
  if (!jobDescription) return []
  
  const jobKeywords = jobDescription.toLowerCase().match(/\b\w+\b/g) || []
  const resumeText = JSON.stringify(optimizedData).toLowerCase()
  
  const matched = jobKeywords.filter(keyword => 
    keyword.length > 3 && resumeText.includes(keyword)
  )
  
  // Remove duplicates and return top 10
  return [...new Set(matched)].slice(0, 10)
}

function generateOptimizedResumeContent(optimizedData: any): string {
  // Generate clean, ATS-friendly HTML content based on the optimized data
  return `
    <div class="resume-optimized">
      <header>
        <h1>${optimizedData.personalInfo?.name || 'Name'}</h1>
        <div class="contact-info">
          ${optimizedData.personalInfo?.email ? `<span>${optimizedData.personalInfo.email}</span>` : ''}
          ${optimizedData.personalInfo?.phone ? `<span>${optimizedData.personalInfo.phone}</span>` : ''}
          ${optimizedData.personalInfo?.location ? `<span>${optimizedData.personalInfo.location}</span>` : ''}
        </div>
      </header>
      
      ${optimizedData.summary ? `
        <section class="summary">
          <h2>Professional Summary</h2>
          <p>${optimizedData.summary}</p>
        </section>
      ` : ''}
      
      ${optimizedData.experience?.length ? `
        <section class="experience">
          <h2>Professional Experience</h2>
          ${optimizedData.experience.map((exp: any) => `
            <div class="experience-item">
              <h3>${exp.position} - ${exp.company}</h3>
              <div class="dates">${exp.startDate} - ${exp.endDate}</div>
              ${exp.achievements?.length ? `
                <ul>
                  ${exp.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </section>
      ` : ''}
      
      ${optimizedData.skills?.length ? `
        <section class="skills">
          <h2>Skills</h2>
          <div class="skills-list">
            ${optimizedData.skills.join(', ')}
          </div>
        </section>
      ` : ''}
      
      ${optimizedData.education?.length ? `
        <section class="education">
          <h2>Education</h2>
          ${optimizedData.education.map((edu: any) => `
            <div class="education-item">
              <h3>${edu.degree} in ${edu.field}</h3>
              <div>${edu.institution} - ${edu.graduationDate}</div>
            </div>
          `).join('')}
        </section>
      ` : ''}
    </div>
  `
} 