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

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const resumeLimit = parseInt(searchParams.get('resumeLimit') || '5')
    const analysisLimit = parseInt(searchParams.get('analysisLimit') || '10')

    // Get multiple recent resumes with their most recent extracted data
    const recentResumes = await db.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: resumeLimit,
      include: {
        extractedResumes: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the most recent extracted data
          select: {
            id: true,
            data: true,
            createdAt: true
          }
        }
      }
    })

    // Get multiple recent job descriptions directly by user
    const recentJobDescriptions = await db.extractedJobDescription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: analysisLimit,
      include: {
        summarizedJobDescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            summary: true
          }
        },
        generatedRoasts: {
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            overallScore: true,
            createdAt: true
          }
        }
      }
    })

    // Process resumes - no more duplicates
    const processedResumes = recentResumes.map(resume => ({
      id: resume.id,
      filename: resume.filename,
      images: resume.images || [],
      createdAt: resume.createdAt.toISOString(),
      extractedData: resume.extractedResumes?.length > 0 ? resume.extractedResumes[0].data : null
    }))

    console.log('Debug - Recent resumes count:', recentResumes.length)
    console.log('Debug - Recent job descriptions count:', recentJobDescriptions.length)

    // Process job descriptions - much simpler now!
    const processedJobDescriptions = recentJobDescriptions
      .map(job => {
        let jobDescription = null
        let jobTitle = 'Untitled Job'
        
        // Try original text first (prioritize over summarized)
        if (job.originalText && job.originalText.trim()) {
          jobDescription = job.originalText
          
          // Try to extract job title from the beginning of the text
          const lines = job.originalText.split('\n').filter((line: string) => line.trim())
          if (lines.length > 0) {
            // Look for common job title patterns in the first few lines
            const firstLine = lines[0].trim()
            const secondLine = lines.length > 1 ? lines[1].trim() : ''
            
            // If first line looks like a job title (short and doesn't contain common job description words)
            if (firstLine.length < 100 && !firstLine.toLowerCase().includes('we are') && 
                !firstLine.toLowerCase().includes('company') && !firstLine.toLowerCase().includes('looking for')) {
              jobTitle = firstLine
            } else if (secondLine.length < 100 && secondLine.length > 0) {
              jobTitle = secondLine
            } else {
              jobTitle = firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '')
            }
          }
        }
        // Fallback to data field
        else if (job.data) {
          const jobData = job.data as any
          jobDescription = jobData.originalText || jobData.text || JSON.stringify(jobData, null, 2)
          jobTitle = jobData.jobTitle || jobData.title || jobData.position || 'Untitled Job'
        }
        // Last resort: use summarized version
        else if (job.summarizedJobDescriptions?.length > 0) {
          const summary = job.summarizedJobDescriptions[0].summary
          jobDescription = typeof summary === 'string' ? summary : JSON.stringify(summary, null, 2)
          
          // Try to extract job title from summary if it's an object
          if (typeof summary === 'object' && summary !== null) {
            const summaryObj = summary as any
            jobTitle = summaryObj.jobTitle || summaryObj.title || summaryObj.position || 'Untitled Job'
          }
        }

        // Get the most recent analysis info for this job
        const mostRecentAnalysis = job.generatedRoasts.length > 0 ? job.generatedRoasts[0] : null

        return {
          id: mostRecentAnalysis?.id || job.id, // Use the analysis ID for UI purposes, fallback to job ID
          jobId: job.id, // The actual job description ID
          title: jobTitle,
          description: jobDescription,
          createdAt: mostRecentAnalysis?.createdAt.toISOString() || job.createdAt.toISOString(),
          overallScore: mostRecentAnalysis?.overallScore || null
        }
      })
      .filter(job => job.description && job.description.trim()) // Only include jobs with actual descriptions

    console.log('Debug - Processed Jobs:', processedJobDescriptions.length)

    return NextResponse.json({
      success: true,
      data: {
        resumes: processedResumes,
        jobDescriptions: processedJobDescriptions,
        counts: {
          totalResumes: recentResumes.length,
          totalJobDescriptions: processedJobDescriptions.length
        }
      }
    })

  } catch (error) {
    console.error('Recent documents fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent documents' },
      { status: 500 }
    )
  }
} 