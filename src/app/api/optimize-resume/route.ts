import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, UserService } from '@/lib/database'
import { LLMLogger, MessageRole } from '@/lib/llm-logger'
import { ANTHROPIC_MODELS, ANTHROPIC_CONTEXT_SIZES, ANTHROPIC_TEMPERATURES, callAnthropicResumeOptimization } from '@/lib/anthropic-utils'
import { callOpenAIText, callOpenAIResumeOptimization, CONTEXT_SIZES, TEMPERATURES } from '@/lib/openai-utils'
import { OPENAI_MODELS } from '@/lib/constants'
import { generateHTMLScreenshot } from '@/lib/screenshot-utils'
import { getTemplateById } from '@/lib/resume-templates'
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

    // Get resume data with enhanced fallback logic
    let resumeContent = ''
    let structuredResumeData = null
    
    // Try to get summarized resume data first (structured format)
    if (analysis.extractedResume && analysis.extractedResume.summarizedResumes && analysis.extractedResume.summarizedResumes.length > 0) {
      const summarizedResume = analysis.extractedResume.summarizedResumes[0]
      if (typeof summarizedResume.summary === 'object' && summarizedResume.summary !== null) {
        // This is structured data - use it directly
        structuredResumeData = summarizedResume.summary
        resumeContent = JSON.stringify(summarizedResume.summary, null, 2)
        console.log('Using structured summarized resume data')
      } else if (typeof summarizedResume.summary === 'string') {
        // This is text data
        resumeContent = summarizedResume.summary
        console.log('Using text summarized resume data')
      }
    } 
    // Fallback 1: Try to get extracted resume data directly
    else if (analysis.extractedResume && analysis.extractedResume.data) {
      if (typeof analysis.extractedResume.data === 'object' && analysis.extractedResume.data !== null) {
        // This is structured data - use it directly
        structuredResumeData = analysis.extractedResume.data
        resumeContent = JSON.stringify(analysis.extractedResume.data, null, 2)
        console.log('Using structured extracted resume data')
      } else if (typeof analysis.extractedResume.data === 'string') {
        // This is text data
        resumeContent = analysis.extractedResume.data
        console.log('Using text extracted resume data')
      }
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

    // If we don't have structured data yet, we need to extract it from the text
    if (!structuredResumeData && resumeContent) {
      console.log('No structured resume data found, will extract from text during optimization')
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
    const prompt = `You are an expert resume optimizer focused on creating CONCISE, impactful resumes. ${structuredResumeData ? 'Optimize the provided structured resume data' : 'Extract and optimize resume data from the provided text'} based on the job requirements:

${structuredResumeData ? 'STRUCTURED RESUME DATA:' : 'RESUME TEXT TO EXTRACT AND OPTIMIZE:'}
${resumeContent}

SUMMARIZED JOB DESCRIPTION:
${jobContent}

CRITICAL REQUIREMENTS - FOLLOW STRICTLY:
1. ${structuredResumeData ? 'OPTIMIZE the existing structured data' : 'EXTRACT all information from the resume text and structure it properly'}
2. BE EXTREMELY CONCISE - Each bullet point should be 1 line maximum
3. Use QUANTIFIED achievements with specific numbers/percentages when possible
4. Limit job descriptions to 2 bullet points per role
5. Professional summary should be 1-2 sentences maximum
6. Skills section should list only the most relevant 4-8 technical skills
7. ALWAYS include 3-5 relevant soft skills (Leadership, Communication, Problem-solving, etc.)
8. Focus on IMPACT and RESULTS, not job duties
9. Use strong action verbs (Led, Increased, Reduced, Implemented, etc.)
10. Match job keywords naturally but don't stuff them
11. Prioritize recent and relevant experience
12. Remove fluff words and unnecessary details
13. MANDATORY: Include both "achievements" and "description" arrays for each experience entry
14. MANDATORY: Include "soft" skills array in the skills section
15. ${structuredResumeData ? '' : 'EXTRACT ALL information from the resume text - do not omit any experience, education, or skills'}

STRUCTURE GUIDELINES:
- Summary: 2-3 sentences highlighting key value proposition
- Experience: Each role MUST have both "description" (1-2 bullets) AND "achievements" (1-2 bullets with quantified results)
- Skills: MUST include "technical", "soft", and "languages" arrays
- Soft skills: Include relevant interpersonal skills like Leadership, Communication, Problem-solving, Team Collaboration, etc.
- Keep total content suitable for 1-2 pages resume
- ${structuredResumeData ? '' : 'Extract all dates in MM/YYYY format'}

MANDATORY FIELDS TO INCLUDE:
- skills.soft: Array of 3-5 relevant soft skills
- skills.technical: Array of technical skills and technologies
- skills.languages: Array of languages (if mentioned)
- experience[].achievements: Array of quantified accomplishments for each role
- experience[].description: Array of concise job responsibilities
- All personal information (name, email, phone, location, etc.)
- All education entries
- All work experience entries
- All projects (if any)
- All certifications and training (if any)
- All publications (if any)

Please use the optimize_resume_data function to return the structured optimization result with CONCISE, impactful content that includes ALL required fields and ${structuredResumeData ? 'optimizes' : 'extracts'} all available information.`

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
      
      // Extract the new data structure
      optimizedData = response.data.optimizedData || response.data
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
      
      // Extract the new data structure
      optimizedData = openAIResponse.data.optimizedData || openAIResponse.data
      response = openAIResponse
      processingTime = openAIResponse.processingTime
      tokensUsed = openAIResponse.usage.totalTokens
      estimatedCost = openAIResponse.cost
    }

    console.log('Resume optimization completed successfully')
    console.log('Processing time:', processingTime, 'ms')
    console.log('Tokens used:', tokensUsed)

    // Extract scoring information from the response
    const scoringData = response.data.scoring || {}
    const improvements = response.data.improvements || []
    
    console.log('📊 Extracted scoring data:', {
      overallScore: scoringData.overallScore,
      scoreLabel: scoringData.scoreLabel,
      keywordMatchPercentage: scoringData.keywordMatch?.matchPercentage
    })

    // Deduct credits for successful model usage
    try {
      await UserService.deductModelCredits(user.id, llm)
      console.log(`Successfully deducted ${affordability.creditCost} credits for model ${llm}`)
    } catch (creditError) {
      console.error('Failed to deduct credits:', creditError)
      // Log the error but don't fail the request since the optimization was successful
    }

    // Calculate ATS score for the optimized resume and extract keywords
    const atsScore = calculateATSScore(optimizedData, jobContent)
    const keywordsMatched = extractKeywordsMatched(optimizedData, jobContent)

    // Get original analysis scoring for comparison
    const originalScore = (analysis?.data && typeof analysis.data === 'object' && 'overallScore' in analysis.data) 
      ? (analysis.data as any).overallScore : null
    const originalAtsScore = (analysis?.data && typeof analysis.data === 'object' && 'keywordMatch' in analysis.data) 
      ? (analysis.data as any).keywordMatch?.matchPercentage : null

    console.log('📈 Score comparison:', {
      originalScore,
      optimizedScore: scoringData.overallScore,
      originalAtsScore,
      optimizedAtsScore: scoringData.keywordMatch?.matchPercentage
    })

    // Generate optimized resume content (HTML)
    const optimizedContent = generateOptimizedResumeContent(optimizedData)

    // Generate screenshots of the optimized resume
    let optimizedImages: string[] = []
    try {
      console.log('Generating screenshots for optimized resume...')
      
      // Use the template to generate properly styled HTML
      const template = getTemplateById('your-resume-style')
      if (template) {
        const styledHTML = template.generateHTML(optimizedData)
        const screenshot = await generateHTMLScreenshot(styledHTML, {
          width: 794,
          height: 1123,
          format: 'png',
          fullPage: true
        })
        optimizedImages = [screenshot]
        console.log('Successfully generated optimized resume screenshot')
      } else {
        console.warn('Template not found, using basic HTML for screenshot')
        const screenshot = await generateHTMLScreenshot(optimizedContent, {
          width: 794,
          height: 1123,
          format: 'png',
          fullPage: true
        })
        optimizedImages = [screenshot]
      }
    } catch (screenshotError) {
      console.error('Failed to generate optimized resume screenshots:', screenshotError)
      // Continue without screenshots - don't fail the entire operation
    }

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
          content: JSON.stringify(response.data),
          messageIndex: 1,
          totalTokens: Math.floor(tokensUsed * 0.2) // Estimate output tokens
        }
      })

      // Save the optimized resume to database using upsert to handle regeneration
      const generatedResume = await db.generatedResume.upsert({
        where: {
          contentHash: contentHash
        },
        update: {
          // Update existing record with new data (for regeneration)
          content: optimizedContent,
          data: optimizedData,
          images: optimizedImages,
          atsScore: atsScore,
          keywordsMatched: keywordsMatched,
          roastId: roastId,
          extractedResumeId: analysis.extractedResumeId,
          extractedJobId: analysis.extractedJobId,
          // Add new scoring fields
          overallScore: scoringData.overallScore || null,
          scoringBreakdown: scoringData.scoringBreakdown || null,
          scoreLabel: scoringData.scoreLabel || null,
          keywordMatchPercentage: scoringData.keywordMatch?.matchPercentage || null,
          originalAtsScore: originalAtsScore
        },
        create: {
          userId: user.id,
          templateId: 'optimized-content', // Generic identifier for optimized content
          contentHash: contentHash,
          content: optimizedContent,
          data: optimizedData,
          images: optimizedImages,
          atsScore: atsScore,
          keywordsMatched: keywordsMatched,
          roastId: roastId,
          extractedResumeId: analysis.extractedResumeId,
          extractedJobId: analysis.extractedJobId,
          // Add new scoring fields
          overallScore: scoringData.overallScore || null,
          scoringBreakdown: scoringData.scoringBreakdown || null,
          scoreLabel: scoringData.scoreLabel || null,
          keywordMatchPercentage: scoringData.keywordMatch?.matchPercentage || null,
          originalAtsScore: originalAtsScore
        }
      })

      generatedResumeId = generatedResume.id

      console.log('✅ Resume optimization saved to database with links:')
      console.log('   - Generated Resume ID:', generatedResumeId)
      console.log('   - Roast ID:', roastId)
      console.log('   - Extracted Resume ID:', analysis.extractedResumeId)
      console.log('   - Extracted Job ID:', analysis.extractedJobId)
      console.log('   - Content Hash:', contentHash)
      console.log('   - Overall Score:', scoringData.overallScore)
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
      scoring: scoringData,
      improvements,
      metadata: {
        tokensUsed,
        processingTime,
        estimatedCost,
        atsScore,
        keywordsMatched,
        optimizationSuggestions: improvements,
        llmCallId,
        creditsDeducted: affordability.creditCost,
        // Score comparisons
        originalScore,
        optimizedScore: scoringData.overallScore,
        originalAtsScore,
        optimizedAtsScore: scoringData.keywordMatch?.matchPercentage
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
              <h3>${exp.title || exp.position} - ${exp.company}</h3>
              <div class="dates">${exp.startDate} - ${exp.endDate}</div>
              ${exp.description?.length ? `
                <ul>
                  ${exp.description.map((desc: string) => `<li>${desc}</li>`).join('')}
                </ul>
              ` : ''}
              ${exp.achievements?.length ? `
                <ul>
                  ${exp.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </section>
      ` : ''}
      
      ${optimizedData.skills ? `
        <section class="skills">
          <h2>Skills</h2>
          <div class="skills-list">
            ${optimizedData.skills.technical?.length ? `
              <div class="skill-category">
                <strong>Technical:</strong> ${optimizedData.skills.technical.join(', ')}
              </div>
            ` : ''}
            ${optimizedData.skills.soft?.length ? `
              <div class="skill-category">
                <strong>Soft Skills:</strong> ${optimizedData.skills.soft.join(', ')}
              </div>
            ` : ''}
            ${optimizedData.skills.languages?.length ? `
              <div class="skill-category">
                <strong>Languages:</strong> ${optimizedData.skills.languages.join(', ')}
              </div>
            ` : ''}
          </div>
        </section>
      ` : ''}
      
      ${optimizedData.education?.length ? `
        <section class="education">
          <h2>Education</h2>
          ${optimizedData.education.map((edu: any) => `
            <div class="education-item">
              <h3>${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>
              <div>${edu.school || edu.institution} - ${edu.graduationDate}</div>
              ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
              ${edu.honors?.length ? `<div>Honors: ${edu.honors.join(', ')}</div>` : ''}
            </div>
          `).join('')}
        </section>
      ` : ''}
      
      ${optimizedData.publications?.length ? `
        <section class="publications">
          <h2>Publications</h2>
          ${optimizedData.publications.map((pub: any) => `
            <div class="publication-item">
              <h3>${pub.title}</h3>
              <div class="publication-authors">${pub.authors || (Array.isArray(pub.authors) ? pub.authors.join(', ') : '')}</div>
              <div class="publication-venue">
                ${pub.journal || pub.publication || pub.conference || ''} (${pub.year || pub.date})
                ${pub.doi ? ` • DOI: ${pub.doi}` : ''}
                ${pub.url || pub.link ? ` • <a href="${pub.url || pub.link}" target="_blank">Link</a>` : ''}
              </div>
              ${pub.description ? `<div class="publication-description">${pub.description}</div>` : ''}
            </div>
          `).join('')}
        </section>
      ` : ''}
      
      ${optimizedData.training?.length ? `
        <section class="training">
          <h2>Training & Certifications</h2>
          ${optimizedData.training.map((cert: any) => `
            <div class="training-item">
              <h3>${cert.name}</h3>
              <div class="training-provider">${cert.provider}</div>
              <div class="training-details">
                Completed: ${cert.completionDate || cert.date}
                ${cert.expirationDate ? ` • Expires: ${cert.expirationDate}` : ''}
                ${cert.credentialId ? ` • ID: ${cert.credentialId}` : ''}
                ${cert.url || cert.link ? ` • <a href="${cert.url || cert.link}" target="_blank">Verify</a>` : ''}
              </div>
              ${cert.description ? `<div class="training-description">${cert.description}</div>` : ''}
              ${cert.skills?.length ? `<div class="training-skills">Skills: ${cert.skills.join(', ')}</div>` : ''}
            </div>
          `).join('')}
        </section>
      ` : ''}
      
      ${optimizedData.projects?.length ? `
        <section class="projects">
          <h2>Projects</h2>
          ${optimizedData.projects.map((proj: any) => `
            <div class="project-item">
              <h3>${proj.name}</h3>
              <div class="project-description">${proj.description}</div>
              ${proj.technologies?.length ? `<div class="project-tech">Technologies: ${proj.technologies.join(', ')}</div>` : ''}
              ${proj.link || proj.url ? `<div class="project-link"><a href="${proj.link || proj.url}" target="_blank">View Project</a></div>` : ''}
            </div>
          `).join('')}
        </section>
      ` : ''}
    </div>
  `
} 