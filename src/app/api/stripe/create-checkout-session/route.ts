import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, STRIPE_PRICE_IDS, validateStripeConfig } from '@/lib/stripe'
import { db } from '@/lib/database'
import { getBaseUrl } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting checkout session creation...')
    
    // Check if Stripe is configured
    if (!validateStripeConfig() || !stripe) {
      console.error('❌ Stripe configuration failed:', {
        hasStripe: !!stripe,
        validateResult: validateStripeConfig()
      })
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.error('❌ Authentication failed - no session or email')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', { email: session.user.email })

    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error('❌ Invalid JSON in request body:', error)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const { priceId, tier, billingCycle } = requestBody

    console.log('📋 Request data:', { 
      priceId, 
      tier, 
      billingCycle
    })

    // Enhanced price ID validation
    if (!priceId) {
      console.error('❌ Missing price ID in request')
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Get all valid price IDs (non-empty strings)
    const validPriceIds = Object.values(STRIPE_PRICE_IDS).filter(id => id && id.trim() !== '')
    
    if (!validPriceIds.includes(priceId)) {
      console.error('❌ Invalid price ID:', priceId)
      return NextResponse.json(
        { error: 'Invalid price ID. Please contact support.' },
        { status: 400 }
      )
    }

    // Validate tier and billingCycle
    if (!tier || !['PLUS', 'PREMIUM'].includes(tier)) {
      console.error('❌ Invalid tier:', tier)
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      console.error('❌ Invalid billing cycle:', billingCycle)
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      console.error('❌ User not found in database:', session.user.email)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('✅ User found:', { 
      userId: user.id, 
      customerId: user.customerId,
      currentTier: user.subscriptionTier 
    })

    let customerId = user.customerId

    if (!customerId) {
      console.log('🔄 Creating new Stripe customer...')
      try {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.name || undefined,
          metadata: {
            userId: user.id,
          },
        })
        
        customerId = customer.id
        console.log('✅ Stripe customer created:', customerId)
        
        // Update user with customer ID
        await db.user.update({
          where: { id: user.id },
          data: { customerId }
        })
        
        console.log('✅ User updated with customer ID')
      } catch (error) {
        console.error('❌ Failed to create Stripe customer:', error)
        return NextResponse.json(
          { error: 'Failed to create customer account' },
          { status: 500 }
        )
      }
    } else {
      // Check if the existing customer ID is valid in the current mode
      try {
        console.log('🔍 Verifying existing customer:', customerId)
        await stripe.customers.retrieve(customerId)
        console.log('✅ Existing customer is valid')
      } catch (error) {
        console.log('⚠️ Existing customer ID is invalid (likely from different mode), creating new customer...')
        
        try {
          // Create new Stripe customer
          const customer = await stripe.customers.create({
            email: session.user.email,
            name: session.user.name || undefined,
            metadata: {
              userId: user.id,
            },
          })
          
          customerId = customer.id
          console.log('✅ New Stripe customer created:', customerId)
          
          // Update user with new customer ID
          await db.user.update({
            where: { id: user.id },
            data: { customerId }
          })
          
          console.log('✅ User updated with new customer ID')
        } catch (createError) {
          console.error('❌ Failed to create new Stripe customer:', createError)
          return NextResponse.json(
            { error: 'Failed to create customer account' },
            { status: 500 }
          )
        }
      }
    }

    // Get the base URL for redirects
    const baseUrl = getBaseUrl()
    
    // Validate base URL
    if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
      console.error('❌ Invalid base URL:', baseUrl)
      return NextResponse.json(
        { error: 'Invalid application URL configuration' },
        { status: 500 }
      )
    }

    console.log('🛒 Creating Stripe checkout session...')

    // Create checkout session parameters
    const checkoutParams = {
      customer: customerId,
      payment_method_types: ['card'] as ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription' as const,
      success_url: `${baseUrl}/dashboard?success=true&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        tier,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier,
          billingCycle,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required' as const,
    }

    // Create checkout session
    let checkoutSession
    try {
      checkoutSession = await stripe.checkout.sessions.create(checkoutParams)
    } catch (stripeError) {
      console.error('❌ Stripe checkout session creation failed:', stripeError)
      
      // Handle specific Stripe errors
      if (stripeError instanceof Error) {
        if (stripeError.message.includes('No such price')) {
          return NextResponse.json(
            { error: 'Invalid pricing configuration. Please contact support.' },
            { status: 400 }
          )
        }
        if (stripeError.message.includes('API key')) {
          return NextResponse.json(
            { error: 'Payment system configuration error. Please contact support.' },
            { status: 500 }
          )
        }
        if (stripeError.message.includes('url')) {
          return NextResponse.json(
            { error: 'Invalid redirect URL configuration. Please contact support.' },
            { status: 500 }
          )
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to create checkout session. Please try again or contact support.' },
        { status: 500 }
      )
    }

    console.log('✅ Checkout session created successfully:', {
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })

  } catch (error) {
    console.error('❌ Unexpected error in checkout session creation:', error)
    
    // Log additional error details
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again or contact support.' },
      { status: 500 }
    )
  }
} 