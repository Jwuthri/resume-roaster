import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roastId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { roastId } = await params

    if (!roastId) {
      return NextResponse.json(
        { error: 'Roast ID is required' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the analysis/roast data with all related information
    const analysis = await db.generatedRoast.findFirst({
      where: {
        id: roastId,
        userId: user.id
      },
      include: {
        extractedResume: {
          include: {
            resume: true  // Include original resume file info
          }
        },
        extractedJob: true
      }
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Extract the analysis data
    const analysisData = analysis.data as any

    // Get resume data and images
    let resumeData = null
    let pdfImages: string[] = []
    let resumeFileName = null

    if (analysis.extractedResume) {
      // Try to get structured resume data
      if (analysis.extractedResume.data) {
        resumeData = analysis.extractedResume.data
      }
      
      // Get PDF images from the original resume file
      if (analysis.extractedResume.resume && analysis.extractedResume.resume.images) {
        pdfImages = analysis.extractedResume.resume.images
        resumeFileName = analysis.extractedResume.resume.filename
      }
    }

    // Get job description data
    let jobDescription = null
    if (analysis.extractedJob) {
      if (typeof analysis.extractedJob.data === 'string') {
        jobDescription = analysis.extractedJob.data
      } else if (analysis.extractedJob.originalText) {
        jobDescription = analysis.extractedJob.originalText
      } else if (typeof analysis.extractedJob.data === 'object') {
        jobDescription = JSON.stringify(analysis.extractedJob.data, null, 2)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        roastId: analysis.id,
        analysisData: analysisData,
        resumeData: resumeData,
        jobDescription: jobDescription,
        pdfImages: pdfImages,
        resumeFileName: resumeFileName,
        documentId: analysis.extractedResume?.resumeId || null,
        extractedResumeId: analysis.extractedResumeId,
        extractedJobId: analysis.extractedJobId,
        createdAt: analysis.createdAt
      }
    })

  } catch (error) {
    console.error('Error fetching analysis data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis data' },
      { status: 500 }
    )
  }
} 