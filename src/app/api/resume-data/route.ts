import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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

    // Get the most recent GeneratedResume for this user
    const latestResume = await db.generatedResume.findFirst({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        extractedJob: true,
        roast: true
      }
    })

    let profileData: {
      resumeData: any
      currentRoastId: string | null
      currentJobDescription: string | null
      isFromAnalysis: boolean
      isFromDashboard: boolean
      lastPage: string | null
    } = {
      resumeData: null,
      currentRoastId: null,
      currentJobDescription: null,
      isFromAnalysis: false,
      isFromDashboard: false,
      lastPage: null
    }

    // If we have a recent resume, extract the data from it
    if (latestResume) {
      try {
        // The data field in GeneratedResume contains the structured resume data
        if (latestResume.data && typeof latestResume.data === 'object') {
          profileData.resumeData = latestResume.data
        }

        // If we have an associated roast, set it as current
        if (latestResume.roastId) {
          profileData.currentRoastId = latestResume.roastId
          profileData.isFromAnalysis = true
        }

        // If we have an associated job description, extract it
        if (latestResume.extractedJob) {
          try {
            // Try to get job description from various sources
            let jobDescription = ''
            
            if (latestResume.extractedJob.originalText) {
              jobDescription = latestResume.extractedJob.originalText
            } else if (latestResume.extractedJob.data && typeof latestResume.extractedJob.data === 'string') {
              jobDescription = latestResume.extractedJob.data
            } else if (latestResume.extractedJob.data && typeof latestResume.extractedJob.data === 'object') {
              jobDescription = JSON.stringify(latestResume.extractedJob.data, null, 2)
            }

            if (jobDescription) {
              profileData.currentJobDescription = jobDescription
            }
          } catch (error) {
            console.error('Error extracting job description:', error)
          }
        }

        console.log('Loaded resume data from GeneratedResume:', latestResume.id)
      } catch (error) {
        console.error('Error processing resume data:', error)
      }
    } else {
      console.log('No GeneratedResume found for user, returning empty profile')
    }

    return NextResponse.json({
      success: true,
      data: profileData
    })

  } catch (error) {
    console.error('Error fetching resume data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resume data' },
      { status: 500 }
    )
  }
} 