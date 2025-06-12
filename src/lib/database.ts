import { PrismaClient } from '@/generated/prisma'
import { createHash } from 'crypto'
import { MODEL_CREDIT_COSTS } from '@/lib/constants'

declare global {
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}

// Generate file hash for duplicate detection
export function generateFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

// Resume storage and retrieval
export class ResumeService {
  // Check if resume was already processed
  static async findByHash(fileHash: string) {
    return await db.resume.findUnique({
      where: { fileHash },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    })
  }

  // Create new resume record
  static async create(data: {
    userId?: string
    filename: string
    fileHash: string
    mimeType: string
    images?: string[]
    metadata?: any
  }) {
    return await db.resume.create({
      data: {
        ...data,
        images: data.images || [],
        metadata: data.metadata || null
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    })
  }

  // Get user's recent resumes
  static async getUserResumes(userId: string, limit = 10) {
    return await db.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        filename: true,
        mimeType: true,
        createdAt: true,
        metadata: true
      }
    })
  }

  // Delete old resumes (cleanup)
  static async deleteOldResumes(daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    return await db.resume.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        },
        userId: null // Only delete anonymous resumes
      }
    })
  }

  // Delete resume by ID
  static async deleteById(resumeId: string) {
    return await db.resume.delete({
      where: { id: resumeId }
    })
  }

  // Delete resume by file hash
  static async deleteByHash(fileHash: string) {
    return await db.resume.delete({
      where: { fileHash }
    })
  }

  // Find resume by ID
  static async findById(resumeId: string) {
    return await db.resume.findUnique({
      where: { id: resumeId },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    })
  }
}

// Extracted resume data service
export class ExtractedResumeService {
  // Find by content hash
  static async findByHash(contentHash: string) {
    return await db.extractedResume.findUnique({
      where: { contentHash }
    })
  }

  // Create extracted resume data
  static async create(data: {
    resumeId: string
    userId?: string
    contentHash: string
    data: any
  }) {
    return await db.extractedResume.create({
      data
    })
  }

  // Delete extracted resume data by ID
  static async delete(id: string) {
    return await db.extractedResume.delete({
      where: { id }
    })
  }
}

// Job description service
export class JobDescriptionService {
  // Find by content hash
  static async findByHash(contentHash: string) {
    return await db.extractedJobDescription.findUnique({
      where: { contentHash }
    })
  }

  // Create extracted job description
  static async create(data: {
    userId?: string
    contentHash: string
    originalText: string
    data: any
  }) {
    return await db.extractedJobDescription.create({
      data
    })
  }
}

// Generated content services
export class GeneratedRoastService {
  // Find by content hash
  static async findByHash(contentHash: string) {
    return await db.generatedRoast.findUnique({
      where: { contentHash }
    })
  }

  // Create generated roast
  static async create(data: {
    userId?: string
    resumeId?: string
    extractedResumeId?: string
    extractedJobId?: string
    contentHash: string
    data: any
    overallScore?: number
  }) {
    return await db.generatedRoast.create({
      data
    })
  }

  // Get user's roasts
  static async getUserRoasts(userId: string, limit = 10) {
    return await db.generatedRoast.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        resume: {
          select: { filename: true }
        }
      }
    })
  }
}

// LLM call tracking service
export class LlmCallService {
  // Create LLM call record
  static async create(data: {
    userId?: string
    provider: string
    model: string
    operationType: string
    resumeId?: string
    extractedResumeId?: string
    extractedJobId?: string
    generatedRoastId?: string
    generatedCoverLetterId?: string
    generatedResumeId?: string
  }) {
    return await db.llmCall.create({
      data
    })
  }

  // Update LLM call with results
  static async updateWithResults(id: string, data: {
    totalInputTokens?: number
    totalOutputTokens?: number
    totalTokens?: number
    totalCostUsd?: number
    totalProcessingTimeMs?: number
    status?: 'COMPLETED' | 'FAILED' | 'TIMEOUT'
    errorMessage?: string
    completedAt?: Date
  }) {
    return await db.llmCall.update({
      where: { id },
      data
    })
  }

  // Add message to LLM call
  static async addMessage(data: {
    llmCallId: string
    role: 'system' | 'user' | 'assistant'
    content: string
    messageIndex: number
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    costUsd?: number
    processingTimeMs?: number
    finishReason?: string
    temperature?: number
    maxTokens?: number
    metadata?: any
  }) {
    return await db.llmMessage.create({
      data
    })
  }

  // Get user's LLM usage stats
  static async getUserUsageStats(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = startDate
      if (endDate) where.createdAt.lte = endDate
    }

    const calls = await db.llmCall.findMany({
      where,
      select: {
        provider: true,
        model: true,
        operationType: true,
        totalTokens: true,
        totalCostUsd: true,
        createdAt: true
      }
    })

    const totalCost = calls.reduce((sum, call) => sum + Number(call.totalCostUsd), 0)
    const totalTokens = calls.reduce((sum, call) => sum + call.totalTokens, 0)

    return {
      calls,
      totalCost,
      totalTokens,
      callCount: calls.length
    }
  }
}

// User management
export class UserService {
  // Get or create user
  static async findOrCreate(email: string, name?: string) {
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return existingUser
    }

    return await db.user.create({
      data: {
        email,
        name,
        monthlyRoasts: 0,
        totalRoasts: 0,
        lastRoastReset: new Date()
      }
    })
  }

  // Get credit cost for a model
  static getModelCreditCost(model: string): number {
    return MODEL_CREDIT_COSTS[model as keyof typeof MODEL_CREDIT_COSTS] || 1 // Default to 1 credit if model not found
  }

  // Check if user can afford a specific model
  static async checkModelAffordability(userId: string, model: string) {
    const creditCost = this.getModelCreditCost(model)
    const limits = await this.checkRoastLimit(userId)
    
    return {
      canAfford: limits.canRoast && limits.remaining >= creditCost,
      creditCost,
      remaining: limits.remaining,
      tier: limits.tier
    }
  }

  // Check user's remaining roasts
  static async checkRoastLimit(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) throw new Error('User not found')

    // Reset monthly count if needed
    const now = new Date()
    const lastReset = new Date(user.lastRoastReset)
    const monthsElapsed = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                         (now.getMonth() - lastReset.getMonth())

    if (monthsElapsed >= 1) {
      await db.user.update({
        where: { id: userId },
        data: {
          monthlyRoasts: 0,
          lastRoastReset: now
        }
      })
      user.monthlyRoasts = 0
    }

    // Get limits based on subscription tier
    const MONTHLY_LIMITS = {
      FREE: 10,
      PLUS: 200,
      PREMIUM: -1 // Unlimited
    } as const

    const monthlyLimit = MONTHLY_LIMITS[user.subscriptionTier]
    const monthlyRemaining = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - user.monthlyRoasts)
    
    // Total available credits = monthly remaining + bonus credits
    const totalAvailable = monthlyLimit === -1 ? -1 : monthlyRemaining + user.bonusCredits
    const canRoast = monthlyLimit === -1 || totalAvailable > 0

    return {
      canRoast,
      remaining: totalAvailable,
      monthlyRemaining,
      bonusCredits: user.bonusCredits,
      used: user.monthlyRoasts,
      limit: monthlyLimit,
      tier: user.subscriptionTier
    }
  }

  // Deduct credits for a specific model usage
  static async deductModelCredits(userId: string, model: string) {
    const creditCost = this.getModelCreditCost(model)
    
    // Check if user can afford this
    const affordability = await this.checkModelAffordability(userId, model)
    if (!affordability.canAfford) {
      throw new Error(`Insufficient credits. Need ${creditCost} credits, have ${affordability.remaining}`)
    }

    // Get current user state
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) throw new Error('User not found')

    // Determine how to deduct credits
    let monthlyIncrement = 0
    let bonusDecrement = 0

    // First use monthly allowance, then bonus credits
    const monthlyLimit = user.subscriptionTier === 'FREE' ? 10 : 
                        user.subscriptionTier === 'PLUS' ? 200 : -1
    
    if (monthlyLimit === -1) {
      // Premium users have unlimited monthly credits
      monthlyIncrement = creditCost
    } else {
      const monthlyRemaining = Math.max(0, monthlyLimit - user.monthlyRoasts)
      
      if (monthlyRemaining >= creditCost) {
        // Use monthly credits
        monthlyIncrement = creditCost
      } else {
        // Use remaining monthly + bonus credits
        monthlyIncrement = monthlyRemaining
        bonusDecrement = creditCost - monthlyRemaining
      }
    }

    // Update user credits
    return await db.user.update({
      where: { id: userId },
      data: {
        monthlyRoasts: { increment: monthlyIncrement },
        totalRoasts: { increment: creditCost },
        bonusCredits: { decrement: bonusDecrement }
      }
    })
  }

  // Add bonus credits to user account
  static async addBonusCredits(userId: string, credits: number) {
    return await db.user.update({
      where: { id: userId },
      data: {
        bonusCredits: { increment: credits }
      }
    })
  }

  // Increment roast count (legacy method for backward compatibility)
  static async incrementRoastCount(userId: string) {
    return await db.user.update({
      where: { id: userId },
      data: {
        monthlyRoasts: { increment: 1 },
        totalRoasts: { increment: 1 }
      }
    })
  }

  // Update subscription
  static async updateSubscription(userId: string, data: {
    subscriptionTier?: 'FREE' | 'PLUS' | 'PREMIUM'
    subscriptionId?: string
    customerId?: string
    subscriptionEndsAt?: Date
  }) {
    return await db.user.update({
      where: { id: userId },
      data
    })
  }
} 