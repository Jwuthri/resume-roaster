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

    const { resumeData, jobDescription, analysisData, analysisId, llm = OPENAI_MODELS.MINI } = await request.json()

    if (!resumeData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      )
    }

    // Check if user can afford this model
    const userId = session.user.id!
    const affordability = await UserService.checkModelAffordability(userId, llm)
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

    // Create content hash for deduplication (include LLM in hash)
    const contentString = JSON.stringify({
      resumeData,
      jobDescription: jobDescription || '',
      analysisData: analysisData || {},
      llm
    })
    const contentHash = createHash('sha256').update(contentString).digest('hex')

    // Check if we already have interview prep for this content
    const existingInterviewPrep = await db.interviewPrep.findUnique({
      where: { contentHash }
    })

    if (existingInterviewPrep) {
      return NextResponse.json({
        interviewPrep: existingInterviewPrep.data,
        cached: true,
        metadata: {
          fromCache: true,
          creditsDeducted: 0
        }
      })
    }

    // Generate new interview prep using AI
    const interviewPrepData = await generateInterviewQuestions({
      resumeData,
      jobDescription,
      analysisData,
      llm
    })

    // Deduct credits after successful generation
    try {
      await UserService.deductModelCredits(userId, llm)
      console.log(`Successfully deducted ${affordability.creditCost} credits for interview prep generation`)
    } catch (creditError) {
      console.error('Failed to deduct credits:', creditError)
      // Log error but don't fail the request since AI call succeeded
    }

    // Save to database
    const savedInterviewPrep = await db.interviewPrep.create({
      data: {
        userId: session?.user?.id || null,
        analysisId: analysisId || 'general', // Use analysisId if provided, otherwise use 'general'
        contentHash,
        data: interviewPrepData as any,
        difficulty: 'medium', // Default difficulty
        category: 'general'   // Default category
      }
    })

    return NextResponse.json({
      interviewPrep: interviewPrepData,
      cached: false,
      id: savedInterviewPrep.id,
      metadata: {
        fromCache: false,
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