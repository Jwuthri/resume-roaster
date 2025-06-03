import { NextRequest, NextResponse } from 'next/server'
import PostHogClient from '@/lib/posthog'

export async function POST(request: NextRequest) {
  try {
    const { event, properties } = await request.json()
    
    const posthog = PostHogClient()
    
    // Test server-side event tracking
    posthog.capture({
      distinctId: `test_user_${Date.now()}`,
      event: event || 'server_test_event',
      properties: {
        ...properties,
        server_side: true,
        timestamp: new Date().toISOString(),
        test_type: 'server_api_test'
      }
    })

    // Flush to ensure the event is sent
    await posthog.flush()

    return NextResponse.json({ 
      success: true, 
      message: 'Server-side PostHog event sent successfully',
      event: event || 'server_test_event'
    })
  } catch (error) {
    console.error('Server PostHog test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send server-side PostHog event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const posthog = PostHogClient()
    
    // Test basic PostHog client initialization
    const testEvent = {
      distinctId: `test_user_${Date.now()}`,
      event: 'server_health_check',
      properties: {
        server_side: true,
        timestamp: new Date().toISOString(),
        test_type: 'health_check'
      }
    }

    posthog.capture(testEvent)
    await posthog.flush()

    return NextResponse.json({ 
      success: true, 
      message: 'Server-side PostHog is working',
      testEvent
    })
  } catch (error) {
    console.error('Server PostHog health check error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server-side PostHog health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 