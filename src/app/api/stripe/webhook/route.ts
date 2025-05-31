import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, validateStripeConfig } from '@/lib/stripe'
import { db } from '@/lib/database'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook received at:', new Date().toISOString())
    
    // Check if Stripe is configured
    if (!validateStripeConfig() || !stripe) {
      console.error('❌ Stripe not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    console.log('🔍 Webhook details:', {
      hasBody: !!body,
      hasSignature: !!signature,
      hasWebhookSecret: !!webhookSecret,
      bodyLength: body.length
    })

    if (!signature || !webhookSecret) {
      console.error('❌ Missing signature or webhook secret')
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified, event type:', event.type)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('📦 Processing webhook event:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString()
    })

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🛒 Processing checkout session completed')
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('📋 Processing subscription change')
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        console.log('❌ Processing subscription cancellation')
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription)
        break
      
      case 'invoice.payment_succeeded':
        console.log('💰 Processing payment success')
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        console.log('💸 Processing payment failure')
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string
    const subscriptionId = subscription.id
    const status = subscription.status
    
    // Get tier from metadata
    const tier = subscription.metadata.tier as 'PLUS' | 'PREMIUM'
    
    if (!tier) {
      console.error('No tier found in subscription metadata')
      return
    }

    // Find user by customer ID
    const user = await db.user.findFirst({
      where: { customerId }
    })

    if (!user) {
      console.error(`User not found for customer ID: ${customerId}`)
      return
    }

    // Update user subscription
    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionId,
        subscriptionTier: tier,
        // Reset monthly roasts on subscription change
        monthlyRoasts: 0,
        lastRoastReset: new Date(),
      }
    })

    console.log(`Updated subscription for user ${user.id}: ${tier}`)

  } catch (error) {
    console.error('Error handling subscription change:', error)
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string

    // Find user by customer ID
    const user = await db.user.findFirst({
      where: { customerId }
    })

    if (!user) {
      console.error(`User not found for customer ID: ${customerId}`)
      return
    }

    // Update user to FREE tier
    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionId: null,
        subscriptionTier: 'FREE',
        subscriptionEndsAt: null,
      }
    })

    console.log(`Cancelled subscription for user ${user.id}`)

  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string

    // Find user by customer ID
    const user = await db.user.findFirst({
      where: { customerId }
    })

    if (!user) {
      console.error(`User not found for customer ID: ${customerId}`)
      return
    }

    console.log(`Payment succeeded for user ${user.id}`)

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string

    // Find user by customer ID
    const user = await db.user.findFirst({
      where: { customerId }
    })

    if (!user) {
      console.error(`User not found for customer ID: ${customerId}`)
      return
    }

    console.log(`Payment failed for user ${user.id}`)
    
    // You might want to send an email notification here
    // or update the user's status

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const customerId = session.customer as string
    
    console.log('🛒 Checkout session completed:', {
      sessionId: session.id,
      customerId,
      mode: session.mode,
      metadata: session.metadata,
      paymentStatus: session.payment_status,
      amount: session.amount_total
    })

    // Find user by customer ID
    const user = await db.user.findFirst({
      where: { customerId }
    })

    if (!user) {
      console.error(`❌ User not found for customer ID: ${customerId}`)
      return
    }

    console.log('✅ Found user:', {
      userId: user.id,
      email: user.email,
      tier: user.subscriptionTier,
      currentBonusCredits: user.bonusCredits
    })

    // Handle different checkout modes
    if (session.mode === 'subscription') {
      console.log('📋 Processing subscription checkout')
      // Handle subscription checkout
      const subscriptionId = session.subscription as string
      const tier = session.metadata?.tier as 'PLUS' | 'PREMIUM'
      
      if (!tier) {
        console.error('❌ No tier found in session metadata')
        return
      }

      // Update user subscription
      await db.user.update({
        where: { id: user.id },
        data: {
          subscriptionId,
          subscriptionTier: tier,
          // Reset monthly roasts on new subscription
          monthlyRoasts: 0,
          lastRoastReset: new Date(),
        }
      })

      console.log(`✅ Subscription checkout completed for user ${user.id}: ${tier}`)
      
    } else if (session.mode === 'payment') {
      console.log('💳 Processing one-time payment (credit purchase)')
      // Handle one-time credit purchase
      const creditPackage = session.metadata?.creditPackage
      const creditsToAdd = parseInt(session.metadata?.creditsToAdd || '0')
      
      console.log('🔍 Credit purchase details:', {
        creditPackage,
        creditsToAdd,
        metadata: session.metadata
      })
      
      if (!creditPackage || !creditsToAdd) {
        console.error('❌ No credit package or credits amount found in session metadata:', {
          creditPackage,
          creditsToAdd,
          metadata: session.metadata
        })
        return
      }

      // Verify user is PLUS tier (additional security check)
      if (user.subscriptionTier !== 'PLUS') {
        console.error(`❌ Credit purchase attempted by non-PLUS user: ${user.id} (tier: ${user.subscriptionTier})`)
        return
      }

      console.log(`💰 Adding ${creditsToAdd} bonus credits to user ${user.id}`)

      // Add bonus credits to user account
      const { UserService } = await import('@/lib/database')
      const updatedUser = await UserService.addBonusCredits(user.id, creditsToAdd)

      console.log(`✅ Credit purchase completed for user ${user.id}: +${creditsToAdd} bonus credits`)
      console.log('📊 Updated user credits:', {
        previousCredits: user.bonusCredits,
        newCredits: updatedUser.bonusCredits,
        creditsAdded: creditsToAdd
      })
    } else {
      console.log(`ℹ️ Unknown checkout mode: ${session.mode}`)
    }

  } catch (error) {
    console.error('❌ Error handling checkout session completion:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
  }
} 