"use client"

import { useState } from "react"
import { Settings as SettingsIcon, Crown, Calendar, BarChart3, CreditCard, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Navigation } from "@/components/ui/navigation"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/useSubscription"
import { Footer } from "@/components/ui/footer"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { subscription, loading, openCustomerPortal, getRemainingUsage, getSubscriptionStatus } = useSubscription()
  
  const isAuthenticated = status === 'authenticated'

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/auth/signin')
    return null
  }

  // Format date
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  // Get tier badge
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLUS':
        return <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white"><Crown className="h-3 w-3 mr-1" />Plus</Badge>
      case 'PREMIUM':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge>
      default:
        return <Badge variant="outline">Free</Badge>
    }
  }

  // Get usage progress color
  const getUsageColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const remainingUsage = getRemainingUsage()
  const subscriptionStatus = getSubscriptionStatus()

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* Navigation */}
      <Navigation currentPage="settings" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your subscription, usage, and account preferences</p>
          </div>

          <div className="grid gap-8">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{session?.user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{session?.user?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Member Since</label>
                    <p className="text-gray-900">{formatDate(new Date())}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="h-5 w-5" />
                  <span>Subscription Status</span>
                </CardTitle>
                <CardDescription>Your current plan and billing information</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Current Plan</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getTierBadge(subscription?.tier || 'FREE')}
                          {subscriptionStatus === 'active' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {subscriptionStatus === 'expired' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      {subscription?.tier !== 'FREE' && (
                        <Button 
                          variant="outline" 
                          onClick={openCustomerPortal}
                          disabled={loading}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Billing
                        </Button>
                      )}
                    </div>

                    {subscription?.subscriptionEndsAt && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {subscriptionStatus === 'active' ? 'Next Billing Date' : 'Subscription Ended'}
                        </p>
                        <p className="text-gray-900 flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(subscription.subscriptionEndsAt)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Usage Statistics</span>
                </CardTitle>
                <CardDescription>Track your monthly usage and limits</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Resume Credits This Month</span>
                        <span className="text-sm text-gray-600">
                          {subscription?.monthlyRoasts || 0} / {
                            subscription?.tier === 'FREE' ? '3' :
                            subscription?.tier === 'PLUS' ? '100' : 
                            'Unlimited'
                          }
                        </span>
                      </div>
                      {subscription?.tier !== 'PREMIUM' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              subscription?.tier === 'FREE' 
                                ? getUsageColor(5 - (subscription?.monthlyRoasts || 0), 5)
                                : getUsageColor(100 - (subscription?.monthlyRoasts || 0), 100)
                            }`}
                            style={{
                              width: subscription?.tier === 'FREE' 
                                ? `${Math.min(((subscription?.monthlyRoasts || 0) / 5) * 100, 100)}%`
                                : `${Math.min(((subscription?.monthlyRoasts || 0) / 100) * 100, 100)}%`
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total Credits</span>
                        <span className="text-sm text-gray-600">{subscription?.totalRoasts || 0}</span>
                      </div>
                    </div>

                    {subscription?.bonusCredits && subscription.bonusCredits > 0 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Bonus Credits</span>
                          <span className="text-sm text-gray-600 font-medium text-orange-600">
                            {subscription.bonusCredits}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Extra credits that don't reset monthly
                        </p>
                      </div>
                    )}

                    {remainingUsage !== -1 && remainingUsage <= 1 && subscription?.tier === 'FREE' && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">Usage Limit Warning</p>
                            <p className="text-sm text-orange-600">
                              You have {remainingUsage} credit{remainingUsage !== 1 ? 's' : ''} remaining this month. 
                              Consider upgrading to Pro for unlimited credits.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Common account management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => router.push('/pricing')}
                  >
                    <div className="text-left">
                      <div className="font-medium">View Plans</div>
                      <div className="text-sm text-gray-500">Compare and upgrade your plan</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => router.push('/dashboard')}
                  >
                    <div className="text-left">
                      <div className="font-medium">Dashboard</div>
                      <div className="text-sm text-gray-500">View your resume history</div>
                    </div>
                  </Button>

                  {subscription?.tier !== 'FREE' && (
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto p-4"
                      onClick={openCustomerPortal}
                    >
                      <div className="text-left">
                        <div className="font-medium">Billing Portal</div>
                        <div className="text-sm text-gray-500">Manage payment methods and invoices</div>
                      </div>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => router.push('/')}
                  >
                    <div className="text-left">
                      <div className="font-medium">New Analysis</div>
                      <div className="text-sm text-gray-500">Analyze another resume</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
} 