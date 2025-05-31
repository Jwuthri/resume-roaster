"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Loader2, Coins, Zap } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useSubscription } from '@/hooks/useSubscription'

interface CreditPurchaseProps {
  className?: string
}

export function CreditPurchase({ className }: CreditPurchaseProps) {
  const { data: session } = useSession()
  const { subscription, forceRefresh } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)

  // Only show for PLUS users
  if (!subscription || subscription.tier !== 'PLUS') {
    return null
  }

  const handlePurchaseCredits = async () => {
    if (!session) {
      toast.error('Please sign in to purchase credits')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-credit-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditPackage: 'CREDIT_PACK_200',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Credit purchase error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout process')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-900">Buy Extra Credits</CardTitle>
        </div>
        <CardDescription className="text-orange-700">
          Need more credits this month? Get 200 additional credits for just $5.99
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">200 Credits</p>
              <p className="text-sm text-gray-600">One-time purchase</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900">$5.99</p>
            <Badge variant="secondary" className="text-xs">
              ~$0.03 per credit
            </Badge>
          </div>
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p>• Credits don't expire and don't reset monthly</p>
          <p>• Used after your monthly allowance is exhausted</p>
          <p>• Available only for PLUS subscribers</p>
        </div>

        <Button 
          className="w-full bg-orange-600 hover:bg-orange-700" 
          onClick={handlePurchaseCredits}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Buy 200 Credits - $5.99
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 