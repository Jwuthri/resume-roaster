import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'
import { callAnthropicResumeOptimization, ANTHROPIC_MODELS, ANTHROPIC_CONTEXT_SIZES, ANTHROPIC_TEMPERATURES } from '@/lib/anthropic-utils'
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

    const startTime = Date.now()
    
    const { 
      resumeText, 
      analysisData, 
      jobDescription, 
      analysisId,
      bypassCache = false
    } = await request.json()

    console.log('=== EXTRACT RESUME DATA DEBUG ===')
    console.log('Resume text length:', resumeText?.length || 0)
    console.log('Has analysis data:', !!analysisData)
    console.log('Job description length:', jobDescription?.length || 0)
    console.log('Analysis ID:', analysisId)
    console.log('Bypass cache:', bypassCache)

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      )
    }

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

    // Truncate resume text if too long (keep within reasonable limits for API)
    const maxResumeLength = 8000 // Reasonable limit for resume text
    const truncatedResumeText = resumeText.length > maxResumeLength 
      ? resumeText.substring(0, maxResumeLength) + '\n\n[Resume truncated for processing...]'
      : resumeText

    console.log('Truncated resume text length:', truncatedResumeText.length)
    console.log('Job description length:', jobDescription?.length || 0)

    // Use a default template ID for now (we can make this configurable later)
    const templateId = 'modern-professional'

    // Generate content hash for deduplication - include analysis ID to ensure uniqueness per analysis
    const contentHash = crypto.createHash('sha256')
      .update(truncatedResumeText + (jobDescription || '') + templateId + (analysisId || ''))
      .digest('hex')

    // Check for existing optimized resume (unless bypassing)
    if (!bypassCache) {
      const existingResume = await db.generatedResume.findFirst({
        where: {
          userId: user.id,
          contentHash: contentHash
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (existingResume) {
        console.log('Returning existing optimized resume from database')
        
        return NextResponse.json({
          success: true,
          data: existingResume.data,
          cached: true,
          resumeId: existingResume.id,
          metadata: {
            atsScore: existingResume.atsScore || 75,
            keywordsMatched: existingResume.keywordsMatched || [],
            fromDatabase: true
          }
        })
      }
    }

    console.log('No existing optimized resume found, generating new one...')

    // Create the extraction prompt
    const prompt = `Extract and structure the following resume data into a comprehensive JSON format:

${jobDescription ? `
TARGET JOB DESCRIPTION:
${jobDescription}
` : ''}

RESUME TEXT:
${truncatedResumeText}

${analysisData ? `
ANALYSIS INSIGHTS:
- Overall Score: ${analysisData.overallScore}%
- Key Strengths: ${analysisData.strengths?.slice(0, 3).join(', ')}
- Areas for Improvement: ${analysisData.weaknesses?.slice(0, 3).join(', ')}
- Matched Keywords: ${analysisData.keywordMatch?.matched?.slice(0, 5).join(', ')}
- Missing Keywords: ${analysisData.keywordMatch?.missing?.slice(0, 5).join(', ')}
` : ''}

IMPORTANT INSTRUCTIONS:
1. Extract information accurately from the resume text
2. Optimize content for ATS compatibility
3. Include quantified achievements where possible
4. Match keywords from the job description naturally
5. Ensure all dates are in MM/YYYY format
6. If information is missing, use null or empty arrays as appropriate
7. Make sure you don't omit any information from the resume text, this is the most important part of the process.

Please use the optimize_resume_data function to return the structured data.`

    console.log('Final prompt length:', prompt.length)
    console.log('Estimated tokens (rough):', Math.ceil(prompt.length / 4))
    console.log('=== END DEBUG ===')

    // Use centralized Anthropic utility with function calling
    const response = await callAnthropicResumeOptimization(prompt, {
      model: ANTHROPIC_MODELS.SONNET,
      maxTokens: 4000,
      temperature: 0.3,
      systemPrompt: 'You are an expert resume parser and career coach. Extract resume data into structured JSON format that is optimized for ATS systems and tailored for the target job. Use the provided tool to return structured data.'
    })

    const extractedData = response.data
    const processingTime = response.processingTime
    const tokensUsed = response.usage.totalTokens
    const estimatedCost = response.cost

    console.log('Resume extraction completed successfully')
    console.log('Processing time:', processingTime, 'ms')
    console.log('Tokens used:', tokensUsed)
    console.log('Used tools:', response.usedTools)

    // Calculate ATS score and keyword matching
    const atsScore = calculateATSScore(extractedData, jobDescription || '')
    const keywordsMatched = extractKeywordsMatched(extractedData, jobDescription || '')

    // Generate optimized resume content (HTML/markdown)
    const optimizedContent = generateOptimizedResumeContent(extractedData, templateId)

    // Store the extraction in database
    let llmCallId = null
    let generatedResumeId = null
    
    try {
      // Create LLM call record
      const llmCall = await db.llmCall.create({
        data: {
          userId: user.id,
          provider: 'anthropic',
          model: ANTHROPIC_MODELS.SONNET,
          operationType: 'resume_extraction',
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
          content: JSON.stringify(extractedData),
          messageIndex: 1,
          totalTokens: Math.floor(tokensUsed * 0.2) // Estimate output tokens
        }
      })

      // Save the generated resume to database
      const generatedResume = await db.generatedResume.create({
        data: {
          userId: user.id,
          templateId: templateId,
          contentHash: contentHash,
          content: optimizedContent,
          data: extractedData,
          atsScore: atsScore,
          keywordsMatched: keywordsMatched
        }
      })

      generatedResumeId = generatedResume.id

      console.log('Resume extraction and optimized resume saved to database')
    } catch (dbError) {
      console.error('Failed to store resume extraction:', dbError)
      // Continue without failing the request
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      cached: false,
      resumeId: generatedResumeId,
      metadata: {
        tokensUsed,
        processingTime,
        estimatedCost,
        atsScore,
        keywordsMatched,
        llmCallId
      }
    })

  } catch (error) {
    console.error('Error extracting resume data:', error)
    return NextResponse.json(
      { error: 'Failed to extract resume data' },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateATSScore(extractedData: any, jobDescription: string): number {
  // Simple ATS score calculation based on completeness and keyword matching
  let score = 0
  
  // Check for required fields
  if (extractedData.personalInfo?.name) score += 10
  if (extractedData.personalInfo?.email) score += 10
  if (extractedData.personalInfo?.phone) score += 5
  if (extractedData.summary) score += 15
  if (extractedData.experience?.length > 0) score += 20
  if (extractedData.education?.length > 0) score += 10
  if (extractedData.skills?.technical?.length > 0) score += 15
  
  // Check for quantified achievements
  const hasQuantifiedAchievements = extractedData.experience?.some((exp: any) => 
    exp.achievements?.some((achievement: string) => /\d+/.test(achievement))
  )
  if (hasQuantifiedAchievements) score += 15
  
  return Math.min(score, 100)
}

function extractKeywordsMatched(extractedData: any, jobDescription: string): string[] {
  if (!jobDescription) return []
  
  const jobKeywords = jobDescription.toLowerCase().match(/\b\w+\b/g) || []
  const resumeText = JSON.stringify(extractedData).toLowerCase()
  
  const matched = jobKeywords.filter(keyword => 
    keyword.length > 3 && resumeText.includes(keyword)
  )
  
  // Remove duplicates and return top 10
  return [...new Set(matched)].slice(0, 10)
}

function generateOptimizedResumeContent(extractedData: any, templateId: string): string {
  // Generate HTML content based on the template
  // This is a simplified version - in a real app, you'd have proper templates
  
  return `
    <div class="resume-${templateId}">
      <header>
        <h1>${extractedData.personalInfo?.name || 'Name'}</h1>
        <div class="contact-info">
          ${extractedData.personalInfo?.email ? `<span>${extractedData.personalInfo.email}</span>` : ''}
          ${extractedData.personalInfo?.phone ? `<span>${extractedData.personalInfo.phone}</span>` : ''}
          ${extractedData.personalInfo?.location ? `<span>${extractedData.personalInfo.location}</span>` : ''}
        </div>
      </header>
      
      ${extractedData.summary ? `
        <section class="summary">
          <h2>Professional Summary</h2>
          <p>${extractedData.summary}</p>
        </section>
      ` : ''}
      
      ${extractedData.experience?.length ? `
        <section class="experience">
          <h2>Professional Experience</h2>
          ${extractedData.experience.map((exp: any) => `
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
      
      ${extractedData.skills?.technical?.length ? `
        <section class="skills">
          <h2>Technical Skills</h2>
          <div class="skills-list">
            ${extractedData.skills.technical.join(', ')}
          </div>
        </section>
      ` : ''}
      
      ${extractedData.education?.length ? `
        <section class="education">
          <h2>Education</h2>
          ${extractedData.education.map((edu: any) => `
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