import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roastId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { roastId } = params

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

    // Check if an optimized resume exists for this roast
    const optimizedResume = await db.generatedResume.findFirst({
      where: {
        roastId: roastId,
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent one if multiple exist
      }
    })

    if (!optimizedResume) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          optimizedResume: null
        }
      })
    }

    // Parse the structured data
    let parsedData = null
    try {
      parsedData = typeof optimizedResume.data === 'string' 
        ? JSON.parse(optimizedResume.data) 
        : optimizedResume.data
    } catch (error) {
      console.error('Failed to parse optimized resume data:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        optimizedResume: {
          id: optimizedResume.id,
          templateId: optimizedResume.templateId,
          content: optimizedResume.content,
          data: parsedData,
          images: optimizedResume.images || [],
          atsScore: optimizedResume.atsScore,
          keywordsMatched: optimizedResume.keywordsMatched,
          createdAt: optimizedResume.createdAt
        }
      }
    })

  } catch (error) {
    console.error('Error fetching optimized resume:', error)
    return NextResponse.json(
      { error: 'Failed to fetch optimized resume' },
      { status: 500 }
    )
  }
} 