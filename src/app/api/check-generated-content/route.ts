import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'
import { generateCoverLetterHash, generateOptimizedResumeHash } from '@/lib/cache-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const roastId = searchParams.get('analysisId') || searchParams.get('roastId')
    const type = searchParams.get('type') // 'resume', 'cover-letter', or 'interview-prep'

    if (!roastId || !type) {
      return NextResponse.json(
        { error: 'roastId and type are required' },
        { status: 400 }
      )
    }

    let exists = false
    let contentId = null

    if (type === 'resume') {
      // First, get the analysis to find the linked extractedResumeId and extractedJobId
      const analysis = await db.generatedRoast.findUnique({
        where: { 
          id: roastId,
          userId: session.user.id // Ensure user owns this analysis
        }
      })

      if (analysis && analysis.extractedResumeId) {
        // Check for existing optimized resume linked to this analysis's extracted data
        const existingResume = await db.generatedResume.findFirst({
          where: {
            userId: session.user.id,
            extractedResumeId: analysis.extractedResumeId,
            // Also check extractedJobId if it exists to ensure it's for the same job
            ...(analysis.extractedJobId && { extractedJobId: analysis.extractedJobId })
          },
          orderBy: {
            createdAt: 'desc'
          }
        })
        exists = !!existingResume
        contentId = existingResume?.id
        
        console.log('Checked for existing optimized resume:', {
          roastId,
          extractedResumeId: analysis.extractedResumeId,
          extractedJobId: analysis.extractedJobId,
          exists,
          contentId
        })
      } else {
        console.log('No analysis found or no extractedResumeId for analysis:', roastId)
      }
    } else if (type === 'cover-letter') {
      // For cover letters, we need to check with different tones and job summary combinations
      // This is more complex since we don't know the exact parameters used
      // For now, let's check if any cover letter exists for this user recently
      const existingCoverLetter = await db.generatedCoverLetter.findFirst({
        where: {
          userId: session.user.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      exists = !!existingCoverLetter
      contentId = existingCoverLetter?.id
    } else if (type === 'interview-prep') {
      // Check for existing interview prep for this analysis
      const existingInterviewPrep = await db.generatedInterviewPrep.findFirst({
        where: {
          roastId: roastId,
          ...(session?.user?.id ? { userId: session.user.id } : {})
        }
      })
      exists = !!existingInterviewPrep
      contentId = existingInterviewPrep?.id
    }

    return NextResponse.json({
      exists,
      contentId,
      roastId,
      type
    })

  } catch (error) {
    console.error('Error checking generated content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 