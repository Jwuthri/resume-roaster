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

    const { resumeData, jobDescription, analysisData, roastId, llm = OPENAI_MODELS.MINI } = await request.json()

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

    // Check for existing interview prep with the same content hash
    const existingInterviewPrep = await db.generatedInterviewPrep.findUnique({
      where: { contentHash }
    })

    if (existingInterviewPrep) {
      return NextResponse.json({
        interviewPrep: existingInterviewPrep.data,
        cached: true,
        id: existingInterviewPrep.id,
        usageCount: 1
      })
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

    // Save to database
    const savedInterviewPrep = await db.generatedInterviewPrep.create({
      data: {
        userId: userId,
        roastId: roastId,
        contentHash,
        data: interviewPrepData as any,
        modelName: llm
      }
    })

    return NextResponse.json({
      interviewPrep: interviewPrepData,
      cached: false,
      id: savedInterviewPrep.id,
      usageCount: 1
    })

  } catch (error) {
    console.error('Error generating interview prep:', error)
    return NextResponse.json(
      { error: 'Failed to generate interview prep' },
      { status: 500 }
    )
  }
} 