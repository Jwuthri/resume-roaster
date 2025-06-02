"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Flame, Lock, ArrowRight, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'form' | 'success' | 'error' | 'invalid-token'>('form')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('invalid-token')
      setError('No reset token provided')
    }
  }, [token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 5) {
      newErrors.password = 'Password must be at least 5 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin?reset=success')
        }, 3000)
      } else {
        if (data.error.includes('expired') || data.error.includes('invalid') || data.error.includes('used')) {
          setStatus('invalid-token')
        } else {
          setStatus('error')
        }
        setError(data.error)
      }
    } catch (error) {
      setStatus('error')
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'success') {
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
              <CardTitle className="text-xl">Password Reset Successfully!</CardTitle>
              <CardDescription className="text-green-600">
                Your password has been updated
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Password Updated</h4>
                    <p className="text-xs text-green-700 mt-1">
                      You can now sign in with your new password. You'll be redirected to the sign-in page shortly.
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

  if (status === 'invalid-token') {
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
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-xl">Invalid Reset Link</CardTitle>
              <CardDescription className="text-red-600">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-start space-x-2">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-900">Link Expired or Invalid</h4>
                    <p className="text-xs text-red-700 mt-1">
                      {error || 'This reset link may have expired, been used already, or is invalid. Please request a new password reset.'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Link href="/auth/forgot-password">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Request New Reset Link
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                
                <Link href="/auth/signin">
                  <Button variant="outline" className="w-full">
                    Back to Sign In
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
          <h2 className="text-2xl font-bold text-gray-900">Reset Your Password</h2>
          <p className="text-gray-600 mt-2">Enter your new password below</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Set New Password</CardTitle>
            <CardDescription>
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Security note */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Password Requirements</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Your password must be at least 5 characters long. Choose something secure that you'll remember.
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