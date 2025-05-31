import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { analysisId } = params

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      )
    }

    // Load evaluations for this analysis
    const evaluations = await db.interviewEvaluation.findMany({
      where: {
        analysisId,
        // Only show user's own evaluations if logged in
        ...(session?.user?.id ? { userId: session.user.id } : {})
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data for the frontend
    const transformedEvaluations = evaluations.map(evaluation => ({
      id: evaluation.id,
      evaluation: evaluation.data,
      timestamp: evaluation.createdAt.toISOString(),
      questionsCount: evaluation.questionsCount,
      overallScore: evaluation.overallScore,
      evaluationType: evaluation.evaluationType
    }))

    return NextResponse.json({
      evaluations: transformedEvaluations
    })

  } catch (error) {
    console.error('Error loading evaluations:', error)
    return NextResponse.json(
      { error: 'Failed to load evaluations' },
      { status: 500 }
    )
  }
} 