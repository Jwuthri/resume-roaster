import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, ExtractedResumeService } from '@/lib/database'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { resumeText, resumeId, bypassCache = false } = await request.json()

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      )
    }

    // Get user session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    console.log('Extract resume API called')
    console.log('Resume text length:', resumeText.length)
    console.log('Resume ID:', resumeId)
    console.log('User ID:', userId)
    console.log('Bypass cache:', bypassCache)

    // Generate content hash for caching
    const contentHash = crypto.createHash('sha256')
      .update(resumeText)
      .digest('hex')

    console.log('Content hash:', contentHash)

    // Check for cached extracted resume first (unless bypassing cache)
    if (!bypassCache) {
      const cachedExtractedResume = await ExtractedResumeService.findByHash(contentHash)

      if (cachedExtractedResume) {
        console.log('Returning cached extracted resume')
        
        const data = cachedExtractedResume.data as any
        return NextResponse.json({
          success: true,
          data: data,
          extractedResumeId: cachedExtractedResume.id,
          cached: true,
          metadata: {
            contentHash,
            createdAt: cachedExtractedResume.createdAt.toISOString()
          }
        })
      }
    }

    // For now, return a simple extracted structure
    // In a full implementation, this would call an AI service to extract structured data
    const extractedData = {
      personalInfo: {
        name: "Extracted from resume text",
        email: null,
        phone: null,
        location: null
      },
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: []
      },
      projects: [],
      summary: resumeText.substring(0, 200) + "..."
    }

    // Save extracted data
    const savedExtracted = await ExtractedResumeService.create({
      resumeId: resumeId || crypto.randomUUID(),
      userId: userId || undefined,
      contentHash,
      data: extractedData
    })

    console.log('Extracted resume saved with ID:', savedExtracted.id)

    return NextResponse.json({
      success: true,
      data: extractedData,
      extractedResumeId: savedExtracted.id,
      cached: false,
      metadata: {
        contentHash,
        createdAt: savedExtracted.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Extract resume error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to extract resume data',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
} 