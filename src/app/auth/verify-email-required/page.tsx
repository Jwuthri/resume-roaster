"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Flame, Mail, ArrowRight, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function VerifyEmailRequiredPage() {
  const { data: session } = useSession()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  const handleResendVerification = async () => {
    if (!session?.user?.email) return

    setIsResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: session.user.email })
      })

      const data = await response.json()

      if (response.ok) {
        setResendSuccess(true)
      } else {
        setResendError(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      setResendError('Failed to send verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Flame className="h-10 w-10 text-orange-500" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Resume Roaster
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
            </div>
            <CardTitle className="text-xl">Email Verification Required</CardTitle>
            <CardDescription className="text-yellow-600">
              Please verify your email address to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <Mail className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Verification Needed</h4>
                  <p className="text-xs text-yellow-700 mt-1">
                    To protect our platform and prevent abuse, you need to verify your email address before accessing Resume Roaster features.
                  </p>
                </div>
              </div>
            </div>

            {session?.user?.email && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  We'll send a verification link to:
                </p>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 p-2 rounded border">
                  {session.user.email}
                </p>
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <Mail className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Verification Email Sent!</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Check your email and click the verification link. It may take a few minutes to arrive.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {resendError && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600">{resendError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={handleResendVerification}
                disabled={isResending || !session?.user?.email}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Verification Email
                  </>
                )}
              </Button>

              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Sign Out & Use Different Account
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Didn't receive the email?</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure the email address is correct</li>
                <li>• Wait a few minutes for delivery</li>
                <li>• Try clicking the button above again</li>
              </ul>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                Having trouble? Contact us at{' '}
                <a href="mailto:support@resume-roaster.xyz" className="text-orange-500 hover:underline">
                  support@resume-roaster.xyz
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-orange-500 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
} 