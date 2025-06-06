"use client"

import { useState } from "react"
import { Check, Crown, Zap, Star, ArrowRight, Rocket, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Navigation } from "@/components/ui/navigation"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useSubscription } from "@/hooks/useSubscription"
import { Footer } from "@/components/ui/footer"

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()
  const { data: session } = useSession()
  const { subscription, loading, createCheckoutSession } = useSubscription()

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for trying out Resume Roaster",
      features: [
        "10 credits per month",
        "AI resume analysis",
        "Basic PDF extraction",
        "Email support",
        "Resume optimization",
        "Cover letter generation"
      ],
      limitations: [],
      cta: "Get Started Free",
      popular: false,
      tier: "FREE"
    },
    {
      name: "Plus",
      price: { monthly: 9.99, yearly: 99.99 },
      description: "Best for active job seekers",
      features: [
        "200 credits per month",
        "Everything in Free",
        "Priority AI processing",
        "Advanced PDF extraction",
        "Document history",
        "ATS optimization",
        "Interview preparation",
        "Priority support"
      ],
      limitations: [],
      cta: "Start Plus Trial",
      popular: true,
      tier: "PLUS"
    },
    {
      name: "Premium",
      price: { monthly: 49.99, yearly: 499.99 },
      description: "For teams and organizations",
      features: [
        "Everything in Plus",
        "Unlimited credits per month",
        "Bulk resume processing",
        "Dedicated support",
        "More coming soon"
      ],
      limitations: [],
      cta: "Upgrade to Premium",
      popular: false,
      tier: "PREMIUM"
    }
  ]

  const handleSubscribe = async (tier: string) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (tier === 'FREE') {
      router.push('/')
      return
    }

    try {
      let priceId: string | undefined

      if (tier === 'PLUS') {
        priceId = billingCycle === 'monthly' ? 
          process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID : 
          process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID
      } else if (tier === 'PREMIUM') {
        priceId = billingCycle === 'monthly' ? 
          process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID : 
          process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID
      }

      if (!priceId) {
        throw new Error('Price ID not configured')
      }

      await createCheckoutSession(priceId, tier, billingCycle)
    } catch (error) {
      console.error('Subscription error:', error)
      // Handle error (show toast, etc.)
    }
  }

  const getCurrentPlan = () => {
    if (!subscription) return 'FREE'
    return subscription.tier
  }

  const isCurrentPlan = (tier: string) => {
    return getCurrentPlan() === tier
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Navigation */}
      <Navigation currentPage="pricing" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get the brutal feedback you need to land your dream job. No sugar-coating, just results.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked: boolean) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
              Save 17%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-orange-500 border-2 shadow-xl scale-105' : 'border-gray-200'} transition-all hover:shadow-lg`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center mb-4">
                  {plan.name === 'Free' && <Zap className="h-8 w-8 text-blue-500" />}
                  {plan.name === 'Plus' && <Crown className="h-8 w-8 text-orange-500" />}
                  {plan.name === 'Premium' && <Star className="h-8 w-8 text-purple-500" />}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price[billingCycle]}
                    </span>
                    <span className="text-gray-500 ml-1">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      Save ${(plan.price.monthly * 12 - plan.price.yearly).toFixed(2)} per year
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* CTA Button */}
                <Button 
                  className={`w-full ${plan.popular ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.tier)}
                  disabled={loading || isCurrentPlan(plan.tier)}
                >
                  {isCurrentPlan(plan.tier) ? 'Current Plan' : plan.cta}
                  {!isCurrentPlan(plan.tier) && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                
                {isCurrentPlan(plan.tier) && (
                  <p className="text-center text-sm text-green-600 font-medium">
                    ✓ This is your current plan
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          {/* <h2 className="text-3xl font-bold text-center mb-12">Credit System & Model Tiers</h2> */}
          
          {/* Credit System Explanation */}
          <div className="mb-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="text-xl font-semibold mb-4 text-center">How Our Credit System Works</h3>
            <p className="text-gray-700 mb-6 text-center">
              Different AI models cost different amounts of credits based on their capabilities and processing power.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Rocket className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">OpenAI Models</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Nano (Basic)</span>
                    <Badge variant="outline">1 Credit</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Mini (Fast)</span>
                    <Badge variant="outline">4 Credits</Badge>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Car className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold">Claude Models</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sonnet 4 (Premium)</span>
                    <Badge variant="outline">8 Credits</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Opus 4 (Ultimate)</span>
                    <Badge variant="outline">12 Credits</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                <strong>Example:</strong> With 200 credits, you could generate 50 mini analyses, 25 premium analyses, or 16 ultimate analyses.
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">How do credits work?</h3>
              <p className="text-gray-600">Credits are consumed based on the AI model you choose. More advanced models provide better results but cost more credits. You can always see the credit cost before using any feature.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards (Visa, MasterCard, American Express) through our secure payment processor Stripe.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Our Free plan gives you 10 credits per month to try out the service. No credit card required!</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">How does the AI analysis work?</h3>
              <p className="text-gray-600">Our AI analyzes your resume against job descriptions, checking for ATS compatibility, keyword optimization, and providing actionable feedback to improve your chances.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}