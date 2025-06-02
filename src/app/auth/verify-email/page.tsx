"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Flame, CheckCircle, XCircle, Mail, ArrowRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'already-verified'>('loading')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationToken })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
        
        // Redirect to sign in page after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?verified=true')
        }, 3000)
      } else {
        if (data.error.includes('expired')) {
          setStatus('expired')
        } else if (data.error.includes('already verified')) {
          setStatus('already-verified')
        } else {
          setStatus('error')
        }
        setMessage(data.error)
      }
    } catch (error) {
      setStatus('error')
      setMessage('Failed to verify email. Please try again.')
    }
  }

  const resendVerification = async () => {
    setIsResending(true)
    try {
      // We need to get the email from somewhere - for now, redirect to resend page
      router.push('/auth/resend-verification')
    } catch (error) {
      console.error('Error redirecting to resend page:', error)
    } finally {
      setIsResending(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="h-12 w-12 text-orange-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case 'error':
      case 'expired':
        return <XCircle className="h-12 w-12 text-red-500" />
      case 'already-verified':
        return <CheckCircle className="h-12 w-12 text-blue-500" />
      default:
        return <Mail className="h-12 w-12 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
      case 'expired':
        return 'text-red-600'
      case 'already-verified':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
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
              {getStatusIcon()}
            </div>
            <CardTitle className="text-xl">
              {status === 'loading' && 'Verifying Your Email'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
              {status === 'expired' && 'Link Expired'}
              {status === 'already-verified' && 'Already Verified'}
            </CardTitle>
            <CardDescription className={getStatusColor()}>
              {message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {status === 'success' && (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-900">Welcome to Resume Roaster!</h4>
                      <p className="text-xs text-green-700 mt-1">
                        Your account is now active. You'll be redirected to sign in shortly.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Link href="/auth/signin">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Continue to Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {status === 'expired' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-2">
                    <XCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900">Verification Link Expired</h4>
                      <p className="text-xs text-yellow-700 mt-1">
                        Your verification link has expired. Request a new one to verify your email.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={resendVerification}
                  disabled={isResending}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Request New Verification Email
                    </>
                  )}
                </Button>
              </div>
            )}

            {status === 'already-verified' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Email Already Verified</h4>
                      <p className="text-xs text-blue-700 mt-1">
                        Your email address has already been verified. You can sign in to your account.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Link href="/auth/signin">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Go to Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-2">
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">Verification Failed</h4>
                      <p className="text-xs text-red-700 mt-1">
                        We couldn't verify your email address. The link may be invalid or expired.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    onClick={resendVerification}
                    disabled={isResending}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Request New Verification Email
                      </>
                    )}
                  </Button>
                  
                  <Link href="/auth/signin">
                    <Button variant="outline" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
                  <p className="text-sm text-orange-700">Verifying your email address...</p>
                </div>
              </div>
            )}
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Flame className="h-10 w-10 text-orange-500" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Resume Roaster
              </h1>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
                <p className="text-sm text-orange-700">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
} 