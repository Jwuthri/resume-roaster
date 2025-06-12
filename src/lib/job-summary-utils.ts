import { db } from '@/lib/database'
import crypto from 'crypto'

/**
 * Check if job description should be summarized based on length
 */
export function shouldSummarizeJobDescription(jobDescription: string, maxLength = 3000): boolean {
  return jobDescription.length > maxLength
}

/**
 * Get or create job description summary
 */
export async function getOrCreateJobSummary(jobDescription: string, userId?: string) {
  // Generate content hash for caching
  const contentHash = crypto
    .createHash('sha256')
    .update(jobDescription.trim().toLowerCase())
    .digest('hex')

  console.log('Checking for cached job summary with hash:', contentHash)

  // Check if we already have a summary for this job description
  let existingSummary = await db.summarizedJobDescription.findUnique({
    where: { contentHash }
  })

  if (existingSummary) {
    console.log('Found cached job summary')
    
    return {
      id: existingSummary.id,
      summary: String(existingSummary.summary),
      keyRequirements: [], // Not stored in new schema
      companyName: null, // Not stored in new schema
      jobTitle: null, // Not stored in new schema
      location: null, // Not stored in new schema
      salaryRange: null, // Not stored in new schema
      usageCount: 1, // Not tracked in new schema
      cached: true
    }
  }

  console.log('No cached job summary found, creating basic summary...')

  // For now, create a basic summary (in a full implementation, this would use AI)
  const basicSummary = jobDescription.length > 500 ? 
    jobDescription.substring(0, 500) + '...' : 
    jobDescription

  // First create the ExtractedJobDescription record
  const extractedJob = await db.extractedJobDescription.create({
    data: {
      userId, // Include the user ID
      contentHash: contentHash + '_extracted', // Different hash for extracted vs summary
      originalText: jobDescription,
      data: {
        originalText: jobDescription,
        extractedAt: new Date().toISOString(),
        basicExtraction: true
      }
    }
  })

  // Now create the summary linked to the extracted job
  const savedSummary = await db.summarizedJobDescription.create({
    data: {
      extractedJobId: extractedJob.id,
      contentHash,
      summary: basicSummary
    }
  })

  console.log('Job summary saved with ID:', savedSummary.id)

  return {
    id: savedSummary.id,
    summary: String(savedSummary.summary),
    keyRequirements: [],
    companyName: null,
    jobTitle: null,
    location: null,
    salaryRange: null,
    usageCount: 1,
    cached: false
  }
}

/**
 * Get job summary statistics
 */
export async function getJobSummaryStats() {
  const stats = await db.summarizedJobDescription.aggregate({
    _count: { id: true }
  })

  const topUsed = await db.summarizedJobDescription.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      summary: true,
      createdAt: true
    }
  })

  return {
    totalSummaries: stats._count.id,
    topUsed: topUsed.map(summary => ({
      id: summary.id,
      summary: String(summary.summary).substring(0, 100) + '...',
      createdAt: summary.createdAt
    }))
  }
} 