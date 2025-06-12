"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const STORAGE_KEY = 'resume_roaster_count'
const STORAGE_DATE_KEY = 'resume_roaster_date'

interface UserLimits {
  canRoast: boolean
  remaining: number
  used: number
  limit: number
  tier: string
}

export function useRoastLimit() {
  const { data: session, status } = useSession()
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // For anonymous users, fall back to localStorage
  const [anonymousCount, setAnonymousCount] = useState(0)

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user) {
      // Authenticated user - fetch from database
      fetchUserLimits()
    } else {
      // Anonymous user - use localStorage
      handleAnonymousUser()
    }
  }, [session, status])

  const fetchUserLimits = async () => {
    try {
      const response = await fetch('/api/user/limits')
      if (response.ok) {
        const limits = await response.json()
        setUserLimits(limits)
      } else {
        console.error('Failed to fetch user limits')
        // Fallback to FREE tier limits
        setUserLimits({
          canRoast: true,
          remaining: 10,
          used: 0,
          limit: 10,
          tier: 'FREE'
        })
      }
    } catch (error) {
      console.error('Error fetching user limits:', error)
      setUserLimits({
        canRoast: true,
        remaining: 10,
        used: 0,
        limit: 10,
        tier: 'FREE'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnonymousUser = () => {
    const savedCount = localStorage.getItem(STORAGE_KEY)
    const savedDate = localStorage.getItem(STORAGE_DATE_KEY)
    const today = new Date().toDateString()

    // Reset count if it's a new day
    if (savedDate && savedDate !== today) {
      localStorage.setItem(STORAGE_KEY, '0')
      localStorage.setItem(STORAGE_DATE_KEY, today)
      setAnonymousCount(0)
    } else {
      const count = savedCount ? parseInt(savedCount, 10) : 0
      setAnonymousCount(count)
      
      if (!savedDate) {
        localStorage.setItem(STORAGE_DATE_KEY, today)
      }
    }
    
    setIsLoading(false)
  }

  const incrementRoastCount = async () => {
    if (session?.user) {
      // Authenticated user - update database
      try {
        const response = await fetch('/api/user/increment-roast', {
          method: 'POST'
        })
        if (response.ok) {
          // Refresh user limits
          await fetchUserLimits()
          return true
        }
        return false
      } catch (error) {
        console.error('Error incrementing roast count:', error)
        return false
      }
    } else {
      // Anonymous user - update localStorage
      const newCount = anonymousCount + 1
      setAnonymousCount(newCount)
      localStorage.setItem(STORAGE_KEY, newCount.toString())
      return true
    }
  }

  // Return values based on user type
  if (session?.user && userLimits) {
    // Authenticated user with database limits
    return {
      roastCount: userLimits.used,
      canRoast: userLimits.canRoast,
      isLoading,
      remainingRoasts: userLimits.remaining,
      maxRoasts: userLimits.limit,
      tier: userLimits.tier,
      incrementRoastCount,
      isAuthenticated: true
    }
  } else {
    // Anonymous user with localStorage limits
    const maxFreeRoasts = 10
    const remaining = Math.max(0, maxFreeRoasts - anonymousCount)
    const canRoast = anonymousCount < maxFreeRoasts

    return {
      roastCount: anonymousCount,
      canRoast,
      isLoading,
      remainingRoasts: remaining,
      maxRoasts: maxFreeRoasts,
      tier: 'FREE',
      incrementRoastCount,
      isAuthenticated: false
    }
  }
} 