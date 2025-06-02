"use client"

import { useState } from "react"
import { Flame, Mail, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSent(true)
      } else {
        setError(data.error || 'Failed to send password reset email')
      }
    } catch (error) {
      setError('Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
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
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-xl">Reset Link Sent!</CardTitle>
              <CardDescription className="text-green-600">
                Check your email for password reset instructions
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <Mail className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Check Your Email</h4>
                    <p className="text-xs text-green-700 mt-1">
                      If an account with <strong>{email}</strong> exists, we've sent password reset instructions. The link will expire in 1 hour.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Didn't receive the email?</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure {email} is correct</li>
                  <li>• Wait a few minutes for delivery</li>
                  <li>• Try requesting another reset email</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={() => setSent(false)}
                  variant="outline"
                  className="w-full"
                >
                  Send to Different Email
                </Button>
                
                <Link href="/auth/signin">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Back to Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
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
          <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
          <p className="text-gray-600 mt-2">Enter your email to receive reset instructions</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Reset Your Password</CardTitle>
            <CardDescription>
              We'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError('')
                    }}
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Sign in link */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/auth/signin" className="text-orange-500 hover:underline font-medium">
                  Sign in instead
                </Link>
              </p>
            </div>

            {/* Security note */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Security Note</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    For security reasons, we'll send reset instructions to any email address, but the link will only work if an account exists.
                  </p>
                </div>
              </div>
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