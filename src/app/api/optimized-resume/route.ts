import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'
import crypto from 'crypto'

// Save optimized resume to database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      content, 
      data, 
      templateId, 
      roastId, 
      atsScore, 
      keywordsMatched 
    } = body

    if (!content || !data || !templateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate content hash for deduplication
    const contentHash = crypto.createHash('sha256').update(content).digest('hex')

    // Save to database
    const optimizedResume = await db.generatedResume.upsert({
      where: { contentHash },
      update: {
        content,
        data,
        templateId,
        roastId,
        atsScore,
        keywordsMatched: keywordsMatched || [],
      },
      create: {
        userId: session.user.id,
        content,
        data,
        templateId,
        roastId,
        contentHash,
        atsScore,
        keywordsMatched: keywordsMatched || [],
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: optimizedResume.id,
        contentHash: optimizedResume.contentHash
      } 
    })

  } catch (error) {
    console.error('Error saving optimized resume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get optimized resume from database
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roastId = searchParams.get('roastId')
    const resumeId = searchParams.get('resumeId')

    let optimizedResume

    if (resumeId) {
      // Get specific resume by ID
      optimizedResume = await db.generatedResume.findFirst({
        where: {
          id: resumeId,
          userId: session.user.id
        }
      })
    } else if (roastId) {
      // Get latest resume for this roast
      optimizedResume = await db.generatedResume.findFirst({
        where: {
          roastId,
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      // Get latest resume for this user
      optimizedResume = await db.generatedResume.findFirst({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    if (!optimizedResume) {
      return NextResponse.json({ error: 'Optimized resume not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: optimizedResume
    })

  } catch (error) {
    console.error('Error retrieving optimized resume:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 