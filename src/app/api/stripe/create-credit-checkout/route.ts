import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, STRIPE_PRICE_IDS, validateStripeConfig } from '@/lib/stripe'
import { db } from '@/lib/database'
import { getBaseUrl } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!validateStripeConfig() || !stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { creditPackage } = await request.json()

    // Validate credit package
    if (creditPackage !== 'CREDIT_PACK_200') {
      return NextResponse.json(
        { error: 'Invalid credit package' },
        { status: 400 }
      )
    }

    // Get the price ID for the credit package
    const priceId = STRIPE_PRICE_IDS.CREDIT_PACK_200

    if (!priceId) {
      return NextResponse.json(
        { error: 'Credit package not configured. Please contact support.' },
        { status: 400 }
      )
    }

    // Get user and check if they're PLUS tier
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is PLUS tier
    if (user.subscriptionTier !== 'PLUS') {
      return NextResponse.json(
        { error: 'Credit purchases are only available for PLUS subscribers' },
        { status: 403 }
      )
    }

    let customerId = user.customerId

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })
      
      customerId = customer.id
      
      // Update user with customer ID
      await db.user.update({
        where: { id: user.id },
        data: { customerId }
      })
    }

    // Get the base URL for redirects
    const baseUrl = getBaseUrl()
    
    console.log('Stripe credit checkout session creation:', {
      baseUrl,
      successUrl: `${baseUrl}/dashboard?credit_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dashboard?credit_canceled=true`,
    })

    // Create checkout session for one-time payment
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment, not subscription
      success_url: `${baseUrl}/dashboard?credit_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?credit_canceled=true`,
      metadata: {
        userId: user.id,
        creditPackage: 'CREDIT_PACK_200',
        creditsToAdd: '200',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    console.log('Created credit checkout session:', {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      successUrl: checkoutSession.success_url,
      cancelUrl: checkoutSession.cancel_url
    })

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })

  } catch (error) {
    console.error('Credit checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 