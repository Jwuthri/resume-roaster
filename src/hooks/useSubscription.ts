"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export interface SubscriptionData {
  tier: 'FREE' | 'PLUS' | 'PREMIUM'
  subscriptionId?: string
  customerId?: string
  subscriptionEndsAt?: Date
  monthlyRoasts: number
  totalRoasts: number
  bonusCredits: number
  lastRoastReset: Date
}

export function useSubscription() {
  const { data: session, status } = useSession()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscription data with cache busting
  const fetchSubscription = useCallback(async (bustCache = false) => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // Add cache busting parameter for production environments
      const url = bustCache 
        ? `/api/user/subscription?t=${Date.now()}` 
        : '/api/user/subscription'
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
        
        // Store in sessionStorage for immediate access
        sessionStorage.setItem('subscription-data', JSON.stringify(data))
        sessionStorage.setItem('subscription-timestamp', Date.now().toString())
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch subscription data')
      }
    } catch (err) {
      console.error('Subscription fetch error:', err)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.email])

  // Force refresh subscription data (useful after admin updates)
  const forceRefresh = useCallback(async () => {
    setLoading(true)
    // Clear any cached data
    sessionStorage.removeItem('subscription-data')
    sessionStorage.removeItem('subscription-timestamp')
    await fetchSubscription(true)
  }, [fetchSubscription])

  // Create checkout session for upgrade
  const createCheckoutSession = async (priceId: string, tier: string, billingCycle: string) => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          tier,
          billingCycle,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to start checkout process')
    }
  }

  // Open customer portal
  const openCustomerPortal = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to open customer portal')
      }
    } catch (error) {
      console.error('Portal error:', error)
      toast.error('Failed to open customer portal')
    }
  }

  // Check if user can perform an action based on their subscription
  const canPerformAction = (action: 'roast' | 'download' | 'history') => {
    if (!subscription) return false

    switch (action) {
      case 'roast':
        if (subscription.tier === 'FREE') {
          return subscription.monthlyRoasts < 5
        }
        if (subscription.tier === 'PLUS') {
          return subscription.monthlyRoasts < 100
        }
        return true // PREMIUM has unlimited

      case 'download':
      case 'history':
        return subscription.tier !== 'FREE'

      default:
        return false
    }
  }

  // Get remaining usage for current billing period
  const getRemainingUsage = () => {
    if (!subscription) return 0

    switch (subscription.tier) {
      case 'FREE':
        return Math.max(0, 5 - subscription.monthlyRoasts)
      case 'PLUS':
        const monthlyRemaining = Math.max(0, 100 - subscription.monthlyRoasts)
        return monthlyRemaining + (subscription.bonusCredits || 0)
      case 'PREMIUM':
        return -1 // Unlimited
      default:
        return 0
    }
  }

  // Get subscription status
  const getSubscriptionStatus = () => {
    if (!subscription) return 'loading'

    if (subscription.tier === 'FREE') return 'free'

    if (subscription.subscriptionEndsAt) {
      const now = new Date()
      const endsAt = new Date(subscription.subscriptionEndsAt)
      
      if (now > endsAt) {
        return 'expired'
      }
    }

    return 'active'
  }

  // Check for cached data on mount
  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    // Try to load from cache first for immediate UI update
    const cachedData = sessionStorage.getItem('subscription-data')
    const cachedTimestamp = sessionStorage.getItem('subscription-timestamp')
    
    if (cachedData && cachedTimestamp) {
      const age = Date.now() - parseInt(cachedTimestamp)
      // Use cached data if it's less than 30 seconds old
      if (age < 30000) {
        try {
          setSubscription(JSON.parse(cachedData))
          setLoading(false)
          return
        } catch (e) {
          // Invalid cached data, proceed with fetch
        }
      }
    }

    fetchSubscription()
  }, [session, status, fetchSubscription])

  // Listen for storage events (for cross-tab updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscription-data' && e.newValue) {
        try {
          setSubscription(JSON.parse(e.newValue))
        } catch (error) {
          console.error('Error parsing subscription data from storage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Listen for custom events (for same-tab updates)
  useEffect(() => {
    const handleSubscriptionUpdate = () => {
      forceRefresh()
    }

    window.addEventListener('subscription-updated', handleSubscriptionUpdate)
    return () => window.removeEventListener('subscription-updated', handleSubscriptionUpdate)
  }, [forceRefresh])

  return {
    subscription,
    loading,
    error,
    createCheckoutSession,
    openCustomerPortal,
    canPerformAction,
    getRemainingUsage,
    getSubscriptionStatus,
    refetch: fetchSubscription,
    forceRefresh,
  }
} 