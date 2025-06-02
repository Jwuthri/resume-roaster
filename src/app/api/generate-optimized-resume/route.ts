import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  ResumeData, 
  getTemplateById, 
  optimizeResumeForJob,
  allTemplates 
} from '@/lib/resume-templates'
import { db } from '@/lib/database'
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

    // Better error handling for JSON parsing
    let requestBody
    try {
      const text = await request.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        )
      }
      requestBody = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { 
      resumeData, 
      jobDescription, 
      templateId, 
      format = 'html',
      documentId = null,
      analysisId = null,
      isPreview = false,
      skipOptimization = false
    } = requestBody

    // Validate required fields - job description is optional if skipOptimization is true
    if (!resumeData || (!jobDescription && !skipOptimization)) {
      return NextResponse.json(
        { error: 'Resume data is required. Job description is required unless skipOptimization is true.' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Handle HTML template (existing logic)
    const template = getTemplateById(templateId)
    if (!template) {
      return NextResponse.json(
        { error: `Template ${templateId} not found` },
        { status: 400 }
      )
    }

    // Optimize resume for the job or use original data if skipping optimization
    let optimizedData, suggestions
    if (skipOptimization) {
      // Use original resume data without optimization
      optimizedData = resumeData
      suggestions = [
        "Resume generated with selected template",
        "Consider adding a job description for AI optimization",
        "Template formatting applied"
      ]
    } else {
      // Optimize resume for the job
      const optimizationResult = optimizeResumeForJob(
        resumeData, 
        jobDescription, 
        templateId
      )
      optimizedData = optimizationResult.optimizedData
      suggestions = optimizationResult.suggestions
    }

    // Generate the resume
    const generatedResume = format === 'html' 
      ? template.generateHTML(optimizedData, jobDescription || '')
      : template.generateMarkdown(optimizedData, jobDescription || '')

    const atsScore = skipOptimization ? 0 : calculateATSScore(optimizedData, jobDescription)
    const keywordsFound = skipOptimization ? [] : extractJobKeywords(jobDescription).filter(keyword =>
      resumeData.summary.toLowerCase().includes(keyword.toLowerCase()) ||
      (resumeData.skills.technical || []).some((skill: string) => 
        skill.toLowerCase().includes(keyword.toLowerCase())
      ) ||
      (resumeData.skills.soft || []).some((skill: string) => 
        skill.toLowerCase().includes(keyword.toLowerCase())
      )
    )

    const processingTime = Date.now() - startTime

    // Only store optimization result in database if this is NOT a preview request
    if (!isPreview) {
      try {
        const user = await db.user.findUnique({
          where: { email: session.user.email }
        })

        if (user) {
          await db.generatedResume.create({
            data: {
              userId: user.id,
              roastId: analysisId || null,
              templateId: templateId || 'default',
              contentHash: crypto.randomUUID(), // Generate a unique hash
              content: generatedResume,
              data: JSON.stringify(optimizedData),
              atsScore: atsScore || null,
              keywordsMatched: keywordsFound || []
            }
          })
          console.log('HTML optimization result stored in database')
        }
      } catch (dbError) {
        console.error('Failed to store HTML optimization result:', dbError)
        // Continue without failing the request
      }
    } else {
      console.log('Skipping database save for HTML template preview')
    }

    // Return the optimized resume
    return NextResponse.json({
      success: true,
      data: {
        resume: generatedResume,
        format,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          atsOptimized: template.atsOptimized,
          type: 'html'
        },
        optimizations: {
          suggestions,
          keywordsFound,
          atsScore
        }
      }
    })

  } catch (error) {
    console.error('Error generating optimized resume:', error)
    return NextResponse.json(
      { error: 'Failed to generate optimized resume' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch available templates
export async function GET() {
  try {
    // Return only HTML templates
    const htmlTemplates = allTemplates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      atsOptimized: template.atsOptimized,
      type: 'html' as const
    }))

    return NextResponse.json({
      success: true,
      data: {
        templates: htmlTemplates
      }
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// Helper function to extract keywords from job description
const extractJobKeywords = (jobDescription: string): string[] => {
  const commonKeywords = [
    // Technical skills
    'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Kubernetes',
    'Git', 'Agile', 'Scrum', 'REST', 'API', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL', 'Microservices',
    
    // Soft skills
    'Leadership', 'Communication', 'Problem-solving', 'Team management', 'Project management', 'Strategic planning',
    'Collaboration', 'Innovation', 'Analytical', 'Decision-making', 'Mentoring', 'Cross-functional',
    
    // Business terms
    'Revenue', 'Growth', 'Optimization', 'Efficiency', 'ROI', 'KPI', 'Metrics', 'Analytics', 'Strategy',
    'Operations', 'Process improvement', 'Customer experience', 'Stakeholder management'
  ]

  return commonKeywords.filter(keyword =>
    jobDescription.toLowerCase().includes(keyword.toLowerCase())
  )
}

// Helper function to calculate ATS compatibility score
const calculateATSScore = (resumeData: ResumeData, jobDescription: string): number => {
  let score = 0
  const maxScore = 100

  // Check for keywords in summary (30 points)
  const jobKeywords = extractJobKeywords(jobDescription)
  const summaryKeywords = jobKeywords.filter(keyword =>
    resumeData.summary.toLowerCase().includes(keyword.toLowerCase())
  )
  score += Math.min(30, (summaryKeywords.length / Math.max(jobKeywords.length, 1)) * 30)

  // Check for technical skills match (25 points)
  const techSkillsMatch = jobKeywords.filter(keyword =>
    (resumeData.skills.technical || []).some((skill: string) => 
      skill.toLowerCase().includes(keyword.toLowerCase())
    )
  )
  score += Math.min(25, (techSkillsMatch.length / Math.max(jobKeywords.length, 1)) * 25)

  // Check for soft skills match (15 points)
  const softSkillsMatch = jobKeywords.filter(keyword =>
    (resumeData.skills.soft || []).some((skill: string) => 
      skill.toLowerCase().includes(keyword.toLowerCase())
    )
  )
  score += Math.min(15, (softSkillsMatch.length / Math.max(jobKeywords.length, 1)) * 15)

  // Check for experience relevance (20 points)
  const experienceKeywords = resumeData.experience.flatMap(job => 
    [...job.description, ...job.achievements]
  ).join(' ').toLowerCase()
  
  const experienceMatches = jobKeywords.filter(keyword =>
    experienceKeywords.includes(keyword.toLowerCase())
  )
  score += Math.min(20, (experienceMatches.length / Math.max(jobKeywords.length, 1)) * 20)

  // Basic formatting and structure (10 points)
  let structureScore = 0
  if (resumeData.personalInfo.email && resumeData.personalInfo.phone) structureScore += 3
  if (resumeData.summary && resumeData.summary.length > 50) structureScore += 3
  if (resumeData.experience.length > 0) structureScore += 2
  if (resumeData.skills.technical.length > 0) structureScore += 2
  score += structureScore

  return Math.round(Math.min(maxScore, score))
} 