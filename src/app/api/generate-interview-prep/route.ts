import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, UserService } from '@/lib/database'
import { createHash } from 'crypto'
import { generateInterviewQuestions } from '@/lib/llm/interview-prep'
import { OPENAI_MODELS } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { resumeData, jobDescription, analysisData, roastId, llm = OPENAI_MODELS.MINI, bypassCache = false } = await request.json()

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
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

    console.log('=== INTERVIEW PREP DEBUG ===')
    console.log('User ID:', user.id)
    console.log('Roast ID:', roastId)
    console.log('Selected LLM:', llm)
    console.log('Bypass cache:', bypassCache)
    console.log('Resume data keys:', resumeData ? Object.keys(resumeData) : 'null')
    console.log('Job description length:', jobDescription ? jobDescription.length : 0)
    console.log('Analysis data available:', !!analysisData)

    // Check if user can afford this model
    const affordability = await UserService.checkModelAffordability(user.id, llm)
    if (!affordability.canAfford) {
      return NextResponse.json(
        { 
          error: `Insufficient credits. Interview prep generation costs ${affordability.creditCost} credits, but you only have ${affordability.remaining} credits remaining.`,
          creditCost: affordability.creditCost,
          remaining: affordability.remaining,
          tier: affordability.tier
        },
        { status: 402 } // Payment Required
      )
    }

    // Create content hash for deduplication (include LLM and userId in hash for user-specific caching)
    // Only include stable parts of the data to ensure consistent caching
    const stableAnalysisData = analysisData ? {
      // Only include stable analysis elements, exclude dynamic timestamps, scores that might vary, etc.
      strengths: analysisData.strengths || [],
      weaknesses: analysisData.weaknesses || [],
      suggestions: analysisData.suggestions || [],
      // Include overall score but round it to avoid minor variations
      overallScore: analysisData.overallScore ? Math.round(analysisData.overallScore) : null,
      // Include any other stable analysis elements that are relevant for interview prep
      keywordOptimization: analysisData.keywordOptimization || null,
      industrySpecific: analysisData.industrySpecific || null
    } : null

    // Log analysis data details after stableAnalysisData is defined
    if (analysisData) {
      console.log('Analysis data keys:', Object.keys(analysisData))
      console.log('Stable analysis data:', stableAnalysisData)
    }

    const contentString = JSON.stringify({
      resumeData,
      jobDescription: jobDescription || '',
      analysisData: stableAnalysisData, // Use stable analysis data instead of full object
      llm,
      userId: user.id // Include userId to make cache user-specific
    })
    const contentHash = createHash('sha256').update(contentString).digest('hex')

    console.log('Content hash for user:', user.id, 'with LLM:', llm, 'is:', contentHash)

    // Check for existing interview prep with the same content hash AND user ID (unless bypassing)
    if (!bypassCache) {
      console.log('🔍 Checking cache for existing interview prep...')
      
      const existingInterviewPrep = await db.generatedInterviewPrep.findFirst({
        where: { 
          contentHash: contentHash,
          userId: user.id // Ensure cache is user-specific
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      if (existingInterviewPrep) {
        console.log('✅ CACHE HIT: Returning existing interview prep from database for user:', user.id)
        console.log('   - Cached prep ID:', existingInterviewPrep.id)
        console.log('   - Created at:', existingInterviewPrep.createdAt)
        console.log('   - Model used:', existingInterviewPrep.modelName)
        
        return NextResponse.json({
          interviewPrep: existingInterviewPrep.data,
          cached: true,
          id: existingInterviewPrep.id,
          usageCount: 1,
          metadata: {
            fromDatabase: true,
            roastId: roastId,
            cacheHit: true,
            originalCreatedAt: existingInterviewPrep.createdAt
          }
        })
      } else {
        console.log('❌ CACHE MISS: No existing interview prep found')
        console.log('   - Content hash:', contentHash)
        console.log('   - User ID:', user.id)
        
        // Let's also check if there are any interview preps for this user to debug
        const userInterviewPreps = await db.generatedInterviewPrep.findMany({
          where: { userId: user.id },
          select: { id: true, contentHash: true, createdAt: true, modelName: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
        
        console.log('   - User has', userInterviewPreps.length, 'total interview preps')
        if (userInterviewPreps.length > 0) {
          console.log('   - Recent hashes:', userInterviewPreps.map(p => ({ 
            hash: p.contentHash.substring(0, 8) + '...', 
            model: p.modelName,
            created: p.createdAt.toISOString().substring(0, 10)
          })))
        }
      }
    } else {
      console.log('🔄 BYPASSING CACHE: Forcing new generation')
    }

    console.log('No existing interview prep found, generating new one...')

    // Generate interview prep using the LLM utility
    const interviewPrepData = await generateInterviewQuestions({
      resumeData,
      jobDescription,
      analysisData,
      llm
    })

    console.log('Interview prep generated successfully')

    // Deduct credits for successful model usage
    try {
      await UserService.deductModelCredits(user.id, llm)
      console.log(`Successfully deducted ${affordability.creditCost} credits for model ${llm}`)
    } catch (creditError) {
      console.error('Failed to deduct credits:', creditError)
      // Log the error but don't fail the request since the generation was successful
    }

    // Save to database
    const savedInterviewPrep = await db.generatedInterviewPrep.create({
      data: {
        userId: user.id,
        roastId: roastId,
        contentHash,
        data: interviewPrepData as any,
        modelName: llm
      }
    })

    console.log('✅ Interview prep saved to database:')
    console.log('   - Generated Interview Prep ID:', savedInterviewPrep.id)
    console.log('   - User ID:', user.id)
    console.log('   - Roast ID:', roastId)
    console.log('   - Content Hash:', contentHash)

    return NextResponse.json({
      interviewPrep: interviewPrepData,
      cached: false,
      id: savedInterviewPrep.id,
      usageCount: 1,
      metadata: {
        creditsDeducted: affordability.creditCost
      }
    })

  } catch (error) {
    console.error('Error generating interview prep:', error)
    return NextResponse.json(
      { error: 'Failed to generate interview prep' },
      { status: 500 }
    )
  }
} 