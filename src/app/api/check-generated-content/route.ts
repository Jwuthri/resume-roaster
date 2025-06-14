import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('analysisId')
    const type = searchParams.get('type')

    if (!analysisId || !type) {
      return NextResponse.json({ error: 'Missing analysisId or type parameter' }, { status: 400 })
    }

    if (!['cover-letter', 'interview-prep'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type. Must be cover-letter or interview-prep' }, { status: 400 })
    }

    // First verify the analysis belongs to the user
    const analysis = await db.generatedRoast.findFirst({
      where: {
        id: analysisId,
        userId: session.user.id
      }
    })

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    let exists = false

    if (type === 'cover-letter') {
      // Check if cover letter exists for this analysis
      const coverLetter = await db.generatedCoverLetter.findFirst({
        where: {
          roastId: analysisId
        }
      })
      exists = !!coverLetter
    } else if (type === 'interview-prep') {
      // Check if interview prep exists for this analysis
      const interviewPrep = await db.generatedInterviewPrep.findFirst({
        where: {
          roastId: analysisId
        }
      })
      exists = !!interviewPrep
    }

    return NextResponse.json({ exists })
  } catch (error) {
    console.error('Error checking generated content:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 