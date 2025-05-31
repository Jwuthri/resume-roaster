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

    console.log(`Fetching subscription data for user: ${session.user.email}`)

    // Get user subscription data
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionId: true,
        customerId: true,
        subscriptionEndsAt: true,
        monthlyRoasts: true,
        totalRoasts: true,
        bonusCredits: true,
        lastRoastReset: true,
        updatedAt: true,
      }
    })

    if (!user) {
      console.error(`User not found for email: ${session.user.email}`)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log(`Found user subscription data:`, {
      email: session.user.email,
      tier: user.subscriptionTier,
      monthlyRoasts: user.monthlyRoasts,
      updatedAt: user.updatedAt
    })

    // Check if monthly roasts need to be reset
    const now = new Date()
    const lastReset = new Date(user.lastRoastReset)
    const monthsElapsed = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                         (now.getMonth() - lastReset.getMonth())

    let updatedUser = user
    if (monthsElapsed >= 1) {
      console.log(`Resetting monthly roasts for user: ${session.user.email}`)
      updatedUser = await db.user.update({
        where: { id: user.id },
        data: {
          monthlyRoasts: 0,
          lastRoastReset: now
        },
        select: {
          id: true,
          subscriptionTier: true,
          subscriptionId: true,
          customerId: true,
          subscriptionEndsAt: true,
          monthlyRoasts: true,
          totalRoasts: true,
          bonusCredits: true,
          lastRoastReset: true,
          updatedAt: true,
        }
      })
    }

    const responseData = {
      tier: updatedUser.subscriptionTier,
      subscriptionId: updatedUser.subscriptionId,
      customerId: updatedUser.customerId,
      subscriptionEndsAt: updatedUser.subscriptionEndsAt,
      monthlyRoasts: updatedUser.monthlyRoasts,
      totalRoasts: updatedUser.totalRoasts,
      bonusCredits: updatedUser.bonusCredits,
      lastRoastReset: updatedUser.lastRoastReset,
    }

    console.log(`Returning subscription data:`, responseData)

    const response = NextResponse.json(responseData)

    // Add headers to prevent caching and ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    // Add timestamp header for debugging
    response.headers.set('X-Subscription-Timestamp', Date.now().toString())

    return response

  } catch (error) {
    console.error('Error fetching subscription:', error)
    
    // More detailed error logging for production debugging
    if (error instanceof Error) {
      console.error('Subscription fetch error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }

    return NextResponse.json(
      { 
        error: 'Failed to fetch subscription data',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 