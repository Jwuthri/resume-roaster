"use client"

import { usePostHog } from 'posthog-js/react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'

export function PostHogTest() {
  const posthog = usePostHog()

  const testEvents = [
    {
      name: 'Test Button Click',
      event: 'test_button_clicked',
      properties: { test_type: 'manual', timestamp: new Date().toISOString() }
    },
    {
      name: 'Test Feature Usage',
      event: 'test_feature_used',
      properties: { feature: 'posthog_integration_test', user_agent: navigator.userAgent }
    },
    {
      name: 'Test Custom Event',
      event: 'custom_test_event',
      properties: { 
        page: 'test_page',
        action: 'verification',
        success: true
      }
    }
  ]

  const handleTestEvent = (eventName: string, properties: any) => {
    if (posthog) {
      posthog.capture(eventName, properties)
      console.log(`✅ PostHog event sent: ${eventName}`, properties)
      alert(`Event "${eventName}" sent to PostHog! Check your browser console and PostHog dashboard.`)
    } else {
      console.error('❌ PostHog not initialized')
      alert('PostHog is not initialized!')
    }
  }

  const testIdentify = () => {
    if (posthog) {
      const testUserId = `test_user_${Date.now()}`
      posthog.identify(testUserId, {
        email: 'test@example.com',
        name: 'Test User',
        test_session: true
      })
      console.log(`✅ PostHog identify called for: ${testUserId}`)
      alert(`User identified as: ${testUserId}`)
    }
  }

  const testServerSide = async () => {
    try {
      const response = await fetch('/api/test-posthog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'server_side_test',
          properties: { test_from: 'client_component' }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Server-side PostHog test successful:', result)
        alert('Server-side PostHog test successful! Check console and PostHog dashboard.')
      } else {
        console.error('❌ Server-side PostHog test failed:', result)
        alert(`Server-side test failed: ${result.error}`)
      }
    } catch (error) {
      console.error('❌ Server-side test error:', error)
      alert('Server-side test failed! Check console for details.')
    }
  }

  const checkPostHogStatus = () => {
    if (posthog) {
      console.log('✅ PostHog Status:', {
        initialized: !!posthog,
        distinctId: posthog.get_distinct_id(),
        sessionId: posthog.get_session_id(),
        config: posthog.config
      })
      alert('PostHog is working! Check browser console for details.')
    } else {
      console.error('❌ PostHog not available')
      alert('PostHog is not available!')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">🔍 PostHog Integration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={checkPostHogStatus}
            variant="outline"
            className="w-full"
          >
            Check PostHog Status
          </Button>
          
          <Button 
            onClick={testIdentify}
            variant="outline"
            className="w-full"
          >
            Test User Identify
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={testServerSide}
            variant="outline"
            className="w-full"
          >
            Test Server-Side PostHog
          </Button>
          
          <Button 
            onClick={() => window.open('https://us.posthog.com', '_blank')}
            variant="outline"
            className="w-full"
          >
            Open PostHog Dashboard
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Test Events:</h3>
          {testEvents.map((test, index) => (
            <Button
              key={index}
              onClick={() => handleTestEvent(test.event, test.properties)}
              variant="secondary"
              size="sm"
              className="w-full justify-start"
            >
              {test.name}
            </Button>
          ))}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Events will appear in your browser console</p>
          <p>• Check PostHog dashboard for real-time events</p>
          <p>• Debug mode is enabled in development</p>
        </div>
      </CardContent>
    </Card>
  )
} 