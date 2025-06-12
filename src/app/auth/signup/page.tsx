"use client"

import { useState } from "react"
import { Flame, Mail, Lock, User, ArrowRight, Github, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAlertDialog } from "@/components/ui/alert-dialog"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()
  const { showAlert, AlertDialog } = useAlertDialog()

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

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
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.needsVerification) {
          // User exists but needs verification
          setErrors({ 
            general: data.error + ' You can also request a new verification email below.' 
          })
        } else {
          setErrors({ general: data.error || 'Failed to create account' })
        }
        return
      }

      // Registration successful - show verification message
      setRegistrationSuccess(true)
      setUserEmail(formData.email)
      
    } catch (error) {
      setErrors({ general: 'Failed to create account. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    showAlert({
      title: "Feature Not Available",
      description: "Google sign-up is not available yet. Please use the email registration form below to create your account.",
      type: "warning",
      confirmText: "Got it"
    })
  }

  const handleGithubSignup = async () => {
    showAlert({
      title: "Feature Not Available", 
      description: "GitHub sign-up is not available yet. Please use the email registration form below to create your account.",
      type: "warning",
      confirmText: "Got it"
    })
  }

  const resendVerification = () => {
    router.push(`/auth/resend-verification?email=${encodeURIComponent(userEmail)}`)
  }

  // Show success message after registration
  if (registrationSuccess) {
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
              <CardTitle className="text-xl">Account Created!</CardTitle>
              <CardDescription className="text-green-600">
                Please verify your email to complete registration
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <Mail className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Check Your Email</h4>
                    <p className="text-xs text-green-700 mt-1">
                      We've sent a verification link to <strong>{userEmail}</strong>. Click the link to activate your account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Didn't receive the email?</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• Wait a few minutes for delivery</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={resendVerification}
                  variant="outline"
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
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
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-600 mt-2">Start getting brutal feedback on your resume</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign up</CardTitle>
            <CardDescription>
              Create an account to track your roasts and upgrade for more features
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleGoogleSignup}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGithubSignup}
                disabled={loading}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {errors.general}
                  {errors.general.includes('not verified') && (
                    <div className="mt-2">
                      <Link href="/auth/resend-verification" className="text-orange-500 hover:underline text-sm">
                        Request new verification email →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={loading}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Terms */}
            <p className="text-xs text-gray-600 text-center">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-orange-500 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-orange-500 hover:underline">Privacy Policy</a>
            </p>

            {/* Sign in link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/auth/signin" className="text-orange-500 hover:underline font-medium">
                  Sign in
                </a>
              </p>
            </div>

            {/* Free trial info */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-2">
                <Flame className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-900">Start with 10 free roasts</h4>
                  <p className="text-xs text-orange-700">
                    Verify your email to activate your account. No credit card required.
                  </p>
                </div>
              </div>
            </div>

            {/* Alert Dialog */}
            {AlertDialog}
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-gray-600 hover:text-orange-500 transition-colors">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
} 