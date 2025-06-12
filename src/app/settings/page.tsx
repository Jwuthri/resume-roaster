"use client"

import { useState, useEffect } from "react"
import { Settings as SettingsIcon, Crown, Calendar, BarChart3, CreditCard, AlertCircle, CheckCircle, FileText, Image, Briefcase, User, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/ui/navigation"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/useSubscription"
import { Footer } from "@/components/ui/footer"

interface Resume {
  id: string
  filename: string
  images: string[]
  createdAt: string
  extractedData: any
}

interface JobDescription {
  id: string
  jobId: string
  title: string
  description: string
  createdAt: string
  overallScore: number | null
}

interface RecentDocuments {
  resumes: Resume[]
  jobDescriptions: JobDescription[]
  counts: {
    totalResumes: number
    totalJobDescriptions: number
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { subscription, loading, openCustomerPortal, getRemainingUsage, getSubscriptionStatus } = useSubscription()
  
  // State for documents
  const [documents, setDocuments] = useState<RecentDocuments | null>(null)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [expandedResumes, setExpandedResumes] = useState<Set<string>>(new Set())
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  
  const isAuthenticated = status === 'authenticated'

  // Load documents from database
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isAuthenticated) return
      
      try {
        setDocumentsLoading(true)
        const response = await fetch('/api/user/recent-documents?resumeLimit=10&analysisLimit=15')
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setDocuments(result.data)
            // Auto-select the most recent items
            if (result.data.resumes.length > 0) {
              setSelectedResumeId(result.data.resumes[0].id)
            }
            if (result.data.jobDescriptions.length > 0) {
              setSelectedJobId(result.data.jobDescriptions[0].id)
            }
          } else {
            console.error('Failed to fetch documents:', result.error)
          }
        } else {
          console.error('Failed to fetch documents:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
      } finally {
        setDocumentsLoading(false)
      }
    }

    fetchDocuments()
  }, [isAuthenticated])

  const selectedResume = documents?.resumes.find(r => r.id === selectedResumeId)
  const selectedJob = documents?.jobDescriptions.find(j => j.id === selectedJobId)

  const handleOpenImageModal = () => {
    setShowImageModal(true)
    setCurrentImageIndex(0)
  }

  const handleCloseImageModal = () => {
    setShowImageModal(false)
  }

  const handlePreviousImage = () => {
    if (selectedResume?.images) {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : selectedResume.images.length - 1))
    }
  }

  const handleNextImage = () => {
    if (selectedResume?.images) {
      setCurrentImageIndex((prev) => (prev < selectedResume.images.length - 1 ? prev + 1 : 0))
    }
  }

  const toggleResumeExpanded = (resumeId: string) => {
    const newExpanded = new Set(expandedResumes)
    if (newExpanded.has(resumeId)) {
      newExpanded.delete(resumeId)
    } else {
      newExpanded.add(resumeId)
    }
    setExpandedResumes(newExpanded)
  }

  const toggleJobExpanded = (jobId: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId)
    } else {
      newExpanded.add(jobId)
    }
    setExpandedJobs(newExpanded)
  }

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/auth/signin')
    return null
  }

  // Format date
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  // Get tier badge
  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'PLUS':
        return <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white"><Crown className="h-3 w-3 mr-1" />Plus</Badge>
      case 'PREMIUM':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge>
      default:
        return <Badge variant="outline">Free</Badge>
    }
  }

  // Get usage progress color
  const getUsageColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100
    if (percentage > 50) return 'bg-green-500'
    if (percentage > 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const remainingUsage = getRemainingUsage()
  const subscriptionStatus = getSubscriptionStatus()

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* Navigation */}
      <Navigation currentPage="settings" />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">Manage your subscription, usage, and account preferences</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="account" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="account" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="subscription" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Crown className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="usage" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Usage
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5" />
                    <span>Account Information</span>
                  </CardTitle>
                  <CardDescription>Your basic account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{session?.user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{session?.user?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Member Since</label>
                      <p className="text-gray-900">{formatDate(new Date())}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>Common account management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto p-4"
                      onClick={() => router.push('/pricing')}
                    >
                      <div className="text-left">
                        <div className="font-medium">View Plans</div>
                        <div className="text-sm text-gray-500">Compare and upgrade your plan</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto p-4"
                      onClick={() => router.push('/dashboard')}
                    >
                      <div className="text-left">
                        <div className="font-medium">Dashboard</div>
                        <div className="text-sm text-gray-500">View your resume history</div>
                      </div>
                    </Button>

                    {subscription?.tier !== 'FREE' && (
                      <Button 
                        variant="outline" 
                        className="justify-start h-auto p-4"
                        onClick={openCustomerPortal}
                      >
                        <div className="text-left">
                          <div className="font-medium">Billing Portal</div>
                          <div className="text-sm text-gray-500">Manage payment methods and invoices</div>
                        </div>
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="justify-start h-auto p-4"
                      onClick={() => router.push('/')}
                    >
                      <div className="text-left">
                        <div className="font-medium">New Analysis</div>
                        <div className="text-sm text-gray-500">Analyze another resume</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5" />
                    <span>Subscription Status</span>
                  </CardTitle>
                  <CardDescription>Your current plan and billing information</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Current Plan</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getTierBadge(subscription?.tier || 'FREE')}
                            {subscriptionStatus === 'active' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {subscriptionStatus === 'expired' && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        {subscription?.tier !== 'FREE' && (
                          <Button 
                            variant="outline" 
                            onClick={openCustomerPortal}
                            disabled={loading}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Billing
                          </Button>
                        )}
                      </div>

                      {subscription?.subscriptionEndsAt && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {subscriptionStatus === 'active' ? 'Next Billing Date' : 'Subscription Ended'}
                          </p>
                          <p className="text-gray-900 flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(subscription.subscriptionEndsAt)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Usage Statistics</span>
                  </CardTitle>
                  <CardDescription>Track your monthly usage and limits</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Resume Credits This Month</span>
                          <span className="text-sm text-gray-600">
                            {subscription?.monthlyRoasts || 0} / {
                              subscription?.tier === 'FREE' ? '10' :
                              subscription?.tier === 'PLUS' ? '200' : 
                              'Unlimited'
                            }
                          </span>
                        </div>
                        {subscription?.tier !== 'PREMIUM' && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                subscription?.tier === 'FREE' 
                                  ? getUsageColor(10 - (subscription?.monthlyRoasts || 0), 10)
                                  : getUsageColor(200 - (subscription?.monthlyRoasts || 0), 200)
                              }`}
                              style={{
                                width: subscription?.tier === 'FREE' 
                                  ? `${Math.min(((subscription?.monthlyRoasts || 0) / 10) * 100, 100)}%`
                                  : `${Math.min(((subscription?.monthlyRoasts || 0) / 200) * 100, 100)}%`
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {subscription?.tier === 'FREE' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            <div>
                              <p className="text-sm font-medium text-orange-800">Upgrade for More Credits</p>
                              <p className="text-sm text-orange-600">
                                Get unlimited resume analyses with our Premium plan
                              </p>
                            </div>
                          </div>
                          <Button 
                            className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => router.push('/pricing')}
                          >
                            View Plans
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {documentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading documents...</p>
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Resumes Section */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Image className="h-6 w-6 text-blue-600" />
                          <span className="text-blue-800">Your Resumes</span>
                        </div>
                        <Badge variant="secondary">{documents?.counts.totalResumes || 0}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {documents?.resumes.length ? `${documents.resumes.length} resume${documents.resumes.length > 1 ? 's' : ''} uploaded` : 'No resumes uploaded yet'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {documents?.resumes && documents.resumes.length > 0 ? (
                        <div className="space-y-4">
                          {/* Resume List */}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {documents.resumes.map((resume) => (
                              <div
                                key={resume.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  selectedResumeId === resume.id
                                    ? 'bg-blue-100 border-blue-300 shadow-sm'
                                    : 'bg-white border-blue-200 hover:bg-blue-50'
                                }`}
                                onClick={() => setSelectedResumeId(resume.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-blue-900 truncate">
                                      {resume.filename}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                      {formatDate(resume.createdAt)} • {resume.images.length} page{resume.images.length > 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  {selectedResumeId === resume.id && (
                                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Selected Resume Preview */}
                          {selectedResume && selectedResume.images.length > 0 && (
                            <div className="space-y-3 border-t border-blue-200 pt-4">
                              <div className="relative bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                                <div className="flex justify-center">
                                  <img
                                    src={`data:image/png;base64,${selectedResume.images[0]}`}
                                    alt="Resume Preview"
                                    className="max-w-full max-h-48 object-contain rounded shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={handleOpenImageModal}
                                  />
                                </div>
                                {selectedResume.images.length > 1 && (
                                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                    {selectedResume.images.length} pages
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                variant="outline"
                                onClick={handleOpenImageModal}
                                className="w-full text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
                              >
                                <Image className="h-4 w-4 mr-2" />
                                View Full Resume ({selectedResume.images.length} page{selectedResume.images.length > 1 ? 's' : ''})
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="p-4 bg-blue-100 rounded-lg w-fit mx-auto mb-4">
                            <FileText className="h-12 w-12 text-blue-600" />
                          </div>
                          <p className="text-gray-600 mb-2">No resumes uploaded yet</p>
                          <p className="text-sm text-gray-500 mb-4">
                            Upload a resume to see it here
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            Upload Resume
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Job Descriptions Section */}
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-6 w-6 text-purple-600" />
                          <span className="text-purple-800">Job Descriptions</span>
                        </div>
                        <Badge variant="secondary">{documents?.counts.totalJobDescriptions || 0}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {documents?.jobDescriptions.length ? `${documents.jobDescriptions.length} job description${documents.jobDescriptions.length > 1 ? 's' : ''} from analyses` : 'No job descriptions available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {documents?.jobDescriptions && documents.jobDescriptions.length > 0 ? (
                        <div className="space-y-4">
                          {/* Job List */}
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {documents.jobDescriptions.map((job) => (
                              <div
                                key={job.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  selectedJobId === job.id
                                    ? 'bg-purple-100 border-purple-300 shadow-sm'
                                    : 'bg-white border-purple-200 hover:bg-purple-50'
                                }`}
                                onClick={() => setSelectedJobId(job.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-purple-900 truncate">
                                      {job.title}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                      <p className="text-xs text-purple-600">
                                        {formatDate(job.createdAt)}
                                      </p>
                                      {job.overallScore && (
                                        <Badge variant="outline" className="text-xs">
                                          {job.overallScore}% score
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {selectedJobId === job.id && (
                                    <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Selected Job Description Preview */}
                          {selectedJob && (
                            <div className="space-y-3 border-t border-purple-200 pt-4">
                              <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm max-h-48 overflow-y-auto">
                                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                  {selectedJob.description.length > 500 
                                    ? `${selectedJob.description.substring(0, 500)}...` 
                                    : selectedJob.description
                                  }
                                </div>
                              </div>
                              
                              {selectedJob.description.length > 500 && (
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    // Create a modal to show full job description
                                    const modal = document.createElement('div')
                                    modal.innerHTML = `
                                      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                        <div class="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto p-6">
                                          <div class="flex justify-between items-center mb-4">
                                            <h3 class="text-lg font-semibold">${selectedJob.title}</h3>
                                            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                                              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                              </svg>
                                            </button>
                                          </div>
                                          <div class="prose max-w-none whitespace-pre-wrap">${selectedJob.description}</div>
                                        </div>
                                      </div>
                                    `
                                    document.body.appendChild(modal)
                                  }}
                                  className="w-full text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100"
                                >
                                  <Briefcase className="h-4 w-4 mr-2" />
                                  View Full Job Description
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="p-4 bg-purple-100 rounded-lg w-fit mx-auto mb-4">
                            <Briefcase className="h-12 w-12 text-purple-600" />
                          </div>
                          <p className="text-gray-600 mb-2">No job descriptions available</p>
                          <p className="text-sm text-gray-500 mb-4">
                            Analyze a resume with a job description to see it here
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                          >
                            Start Analysis
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* PDF Images Modal */}
      {showImageModal && selectedResume?.images && selectedResume.images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Resume Preview - {selectedResume.filename}</h3>
              <div className="flex items-center space-x-4">
                {selectedResume.images.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousImage}
                      disabled={currentImageIndex === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      {currentImageIndex + 1} of {selectedResume.images.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextImage}
                      disabled={currentImageIndex === selectedResume.images.length - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseImageModal}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              <img
                src={`data:image/png;base64,${selectedResume.images[currentImageIndex]}`}
                alt={`Resume Page ${currentImageIndex + 1}`}
                className="max-w-full h-auto mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
} 