import { NextRequest, NextResponse } from 'next/server'

// In production, you'd use a real database
// For now, we'll use an in-memory store (resets on server restart)
const roastCounts = new Map<string, { count: number; lastReset: string }>()

const MAX_FREE_ROASTS = 10

function getClientFingerprint(request: NextRequest): string {
  // Create a simple fingerprint from IP and User-Agent
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') || // Cloudflare
             'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a hash-like identifier (in production, use actual hashing)
  return `${ip}-${userAgent.slice(0, 50)}`
}

function isNewDay(lastReset: string): boolean {
  const today = new Date().toDateString()
  return lastReset !== today
}

export async function GET(request: NextRequest) {
  try {
    const fingerprint = getClientFingerprint(request)
    const today = new Date().toDateString()
    
    let userData = roastCounts.get(fingerprint)
    
    // Reset count if it's a new day
    if (!userData || isNewDay(userData.lastReset)) {
      userData = { count: 0, lastReset: today }
      roastCounts.set(fingerprint, userData)
    }
    
    return NextResponse.json({
      count: userData.count,
      maxRoasts: MAX_FREE_ROASTS,
      canRoast: userData.count < MAX_FREE_ROASTS,
      remainingRoasts: Math.max(0, MAX_FREE_ROASTS - userData.count)
    })
  } catch (error) {
    console.error('Error checking roast limit:', error)
    return NextResponse.json(
      { error: 'Failed to check roast limit' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const fingerprint = getClientFingerprint(request)
    const today = new Date().toDateString()
    
    let userData = roastCounts.get(fingerprint)
    
    // Reset count if it's a new day
    if (!userData || isNewDay(userData.lastReset)) {
      userData = { count: 0, lastReset: today }
    }
    
    // Check if user can still roast
    if (userData.count >= MAX_FREE_ROASTS) {
      return NextResponse.json(
        { 
          error: 'Roast limit exceeded',
          count: userData.count,
          maxRoasts: MAX_FREE_ROASTS,
          canRoast: false
        },
        { status: 429 } // Too Many Requests
      )
    }
    
    // Increment count
    userData.count += 1
    roastCounts.set(fingerprint, userData)
    
    return NextResponse.json({
      count: userData.count,
      maxRoasts: MAX_FREE_ROASTS,
      canRoast: userData.count < MAX_FREE_ROASTS,
      remainingRoasts: Math.max(0, MAX_FREE_ROASTS - userData.count)
    })
  } catch (error) {
    console.error('Error incrementing roast count:', error)
    return NextResponse.json(
      { error: 'Failed to increment roast count' },
      { status: 500 }
    )
  }
} 