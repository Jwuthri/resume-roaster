import { db } from '@/lib/database'
import crypto from 'crypto'
import { OPENAI_MODELS } from './constants'

// Simple cache utilities for the new schema
export function generateCoverLetterHash(resumeText: string, jobSummaryId: string | null, tone: string, analysisId?: string, llm?: string): string {
  return crypto
    .createHash('sha256')
    .update(`${resumeText}-${jobSummaryId || 'no-job'}-${tone}-${analysisId || 'no-analysis'}-${llm || OPENAI_MODELS.MINI}`)
    .digest('hex')
}

export function generateOptimizedResumeHash(resumeData: any, jobDescription: string, templateId: string, analysisId?: string, llm?: string): string {
  return crypto
    .createHash('sha256')
    .update(`${JSON.stringify(resumeData)}-${jobDescription}-${templateId}-${analysisId || 'no-analysis'}-${llm || OPENAI_MODELS.MINI}`)
    .digest('hex')
}

// Simplified cache check for cover letters
export async function checkCachedCoverLetter(resumeText: string, jobSummaryId: string | null, tone: string, analysisId?: string, llm?: string) {
  const contentHash = generateCoverLetterHash(resumeText, jobSummaryId, tone, analysisId, llm)

  const existingCoverLetter = await db.generatedCoverLetter.findUnique({
    where: { contentHash }
  })

  if (existingCoverLetter) {
    return {
      coverLetter: existingCoverLetter.content,
      cached: true,
      usageCount: 1,
      metadata: {
        contentHash,
        createdAt: existingCoverLetter.createdAt.toISOString(),
        fromCache: true
      }
    }
  }

  return null
}

// Simplified cache check for optimized resumes
export async function checkCachedOptimizedResume(resumeData: any, jobDescription: string, templateId: string, analysisId?: string, llm?: string) {
  const contentHash = generateOptimizedResumeHash(resumeData, jobDescription, templateId, analysisId, llm)

  const existingResume = await db.generatedResume.findUnique({
    where: { contentHash }
  })

  if (existingResume) {
    return {
      resume: existingResume.content,
      data: existingResume.data,
      cached: true,
      usageCount: 1,
      metadata: {
        contentHash,
        createdAt: existingResume.createdAt.toISOString(),
        fromCache: true
      }
    }
  }

  return null
}

// Save cover letter to cache
export async function saveCoverLetterToCache(
  resumeText: string, 
  jobSummaryId: string | null, 
  tone: string, 
  content: string,
  userId?: string,
  analysisId?: string,
  llm?: string
) {
  const contentHash = generateCoverLetterHash(resumeText, jobSummaryId, tone, analysisId, llm)

  return await db.generatedCoverLetter.create({
    data: {
      userId: userId || null,
      roastId: analysisId || null,
      contentHash,
      content,
      tone,
      modelName: llm || OPENAI_MODELS.MINI,
      metadata: { tone, summary: resumeText.substring(0, 100) + '...', llm: llm || OPENAI_MODELS.MINI } // Include LLM in metadata
    }
  })
}

// Save optimized resume to cache
export async function saveOptimizedResumeToCache(
  resumeData: any,
  jobDescription: string,
  templateId: string,
  content: string,
  userId?: string,
  analysisId?: string,
  llm?: string
) {
  const contentHash = generateOptimizedResumeHash(resumeData, jobDescription, templateId, analysisId, llm)

  return await db.generatedResume.create({
    data: {
      userId: userId || null,
      roastId: analysisId || null,
      templateId,
      contentHash,
      content,
      data: resumeData
    }
  })
} 