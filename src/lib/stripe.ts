import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance (only available on server)
export const stripe = typeof window === 'undefined' && process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
      typescript: true,
    })
  : null

// Client-side Stripe instance
export const getStripe = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  
  if (!publishableKey) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
    return null
  }
  
  return loadStripe(publishableKey)
}

// Stripe price IDs for your subscription plans (server-side only)
export const STRIPE_PRICE_IDS = typeof window === 'undefined' ? {
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  ENTERPRISE_MONTHLY: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
  ENTERPRISE_YEARLY: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
  CREDIT_PACK_200: process.env.STRIPE_CREDIT_PACK_200_PRICE_ID || '', // 200 credits for $5.99
} as const : {
  PRO_MONTHLY: '',
  PRO_YEARLY: '',
  ENTERPRISE_MONTHLY: '',
  ENTERPRISE_YEARLY: '',
  CREDIT_PACK_200: '',
} as const

// Subscription tier mapping
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    monthlyRoasts: 5,
    features: [
      '5 credits per month',
      'AI-powered PDF extraction',
      'Basic markdown formatting',
      'Claude 4 Sonnet analysis',
      'Email support'
    ]
  },
  PLUS: {
    name: 'Plus',
    monthlyRoasts: 100,
    features: [
      '100 resume roasts per month',
      'Document history',
      'Priority AI processing',
      'Advanced analysis insights',
      'Cover letter generation',
      'ATS optimization tips',
      'Multiple resume versions',
      'Priority email support',
      'Download formatted resumes',
      'Fine tuned AI models'
    ]
  },
  PREMIUM: {
    name: 'Premium',
    monthlyRoasts: -1, // Unlimited
    features: [
      'Unlimited resume roasts',
      'Team collaboration tools',
      'API access',
      'Custom branding',
      'Bulk processing',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantees',
      'Custom AI training'
    ]
  }
} as const

// Validation function for server-side use only
export function validateStripeConfig() {
  if (typeof window !== 'undefined') {
    // Client-side validation
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
      return false
    }
    return true
  }
  
  // Server-side validation
  const requiredServerVars = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  }
  
  const missingVars = Object.entries(requiredServerVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key)
  
  if (missingVars.length > 0) {
    console.error('Missing required Stripe environment variables:', missingVars)
    console.error('Please add these to your .env.local file')
    return false
  }
  
  return true
} 