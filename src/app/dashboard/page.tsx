"use client"

import { useState, useEffect, Suspense } from "react"
import { FileText, TrendingUp, Calendar, Search, Filter, Eye, Download, ArrowLeft, Trash2, ExternalLink, ChevronDown, ChevronUp, MoreHorizontal, Star, Clock, Target, Share2, Brain, Linkedin, Sparkles, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/ui/navigation"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Footer } from "@/components/ui/footer"
import { FeatureAnnouncementBanner } from "@/components/ui/feature-announcement-banner"
import { CoverLetterModal } from "@/components/ui/cover-letter-modal"
import { InterviewPrepModal } from "@/components/ui/interview-prep-modal"
import { ResumeOptimizationModal } from "@/components/ui/resume-optimization-modal"
import { CreditPurchase } from "@/components/CreditPurchase"
import { toast } from 'sonner'
import { useAlertDialog } from "@/components/ui/alert-dialog"

interface AnalysisResult {
  id: string
  type: 'RESUME_ANALYSIS'
  createdAt: string
  overallScore?: number
  title?: string
  documentId?: string
  pdfImages?: string[]
  jobDescription?: string
  data: {
    resumeData?: any
    jobDescription?: string
    analysis?: any
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [interviewPracticeCount, setInterviewPracticeCount] = useState(0)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Modal states
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false)
  const [showInterviewPrepModal, setShowInterviewPrepModal] = useState(false)
  const [showResumeOptimizationModal, setShowResumeOptimizationModal] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null)
  const [isGeneratingOptimized, setIsGeneratingOptimized] = useState(false)
  
  const { showAlert, AlertDialog } = useAlertDialog()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Handle Stripe success redirect
  useEffect(() => {
    const success = searchParams.get('success')
    const tier = searchParams.get('tier')
    const sessionId = searchParams.get('session_id')
    const creditSuccess = searchParams.get('credit_success')
    const creditCanceled = searchParams.get('credit_canceled')
    
    if (success === 'true' && tier) {
      toast.success(`🎉 Welcome to ${tier} plan! Your subscription is now active.`, {
        duration: 5000,
      })
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('tier')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    }

    if (creditSuccess === 'true') {
      toast.success(`🎉 Credit purchase successful! 200 bonus credits have been added to your account.`, {
        duration: 5000,
      })
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('credit_success')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    }

    if (creditCanceled === 'true') {
      toast.info('Credit purchase was canceled.', {
        duration: 3000,
      })
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('credit_canceled')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Fetch analysis history
  const fetchAnalyses = async (page = 1, search = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        type: 'RESUME_ANALYSIS'
      })
      
      if (search) {
        params.append('search', search)
      }

      // Fetch analyses and interview practice count in parallel
      const [analysesResponse, interviewCountResponse] = await Promise.all([
        fetch(`/api/user/analysis-history?${params}`),
        fetch('/api/user/interview-practice-count')
      ])

      if (analysesResponse.ok) {
        const result = await analysesResponse.json()
        
        // Transform the API response to match the expected format
        const transformedAnalyses = (result.data || []).map((item: any) => ({
          id: item.id,
          type: 'RESUME_ANALYSIS',
          createdAt: item.createdAt,
          overallScore: item.overallScore,
          title: item.title,
          documentId: item.documentId,
          pdfImages: item.pdfImages || [],
          jobDescription: item.jobDescription || '',
          data: {
            resumeData: item.data?.resumeData || null,
            jobDescription: item.jobDescription || '',
            analysis: item.data?.analysis || null
          }
        }))
        
        setAnalyses(transformedAnalyses)
        setPagination(result.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 })
      } else {
        console.error('Failed to fetch analyses:', analysesResponse.status, analysesResponse.statusText)
        setAnalyses([])
      }

      // Update interview practice count
      if (interviewCountResponse.ok) {
        const countResult = await interviewCountResponse.json()
        setInterviewPracticeCount(countResult.count || 0)
      } else {
        console.error('Failed to fetch interview practice count')
        setInterviewPracticeCount(0)
      }
    } catch (error) {
      console.error('Error fetching analyses:', error)
      setAnalyses([])
      setInterviewPracticeCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalyses()
    }
  }, [status])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAnalyses(1, searchTerm)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    fetchAnalyses(newPage, searchTerm)
  }

  // Delete analysis
  const handleDelete = async (id: string) => {
    showAlert({
      title: "Delete Analysis",
      description: "Are you sure you want to delete this analysis? This action cannot be undone.",
      type: "warning",
      confirmText: "Delete",
      cancelText: "Cancel",
      showCancel: true,
      onConfirm: async () => {
        try {
          setDeletingId(id)
          const response = await fetch(`/api/user/analysis-history/${id}`, {
            method: 'DELETE'
          })
          
          if (response.ok) {
            toast.success('Analysis deleted successfully!')
            // Refresh the list
            fetchAnalyses(pagination.page, searchTerm)
          } else {
            let errorMessage = 'Failed to delete analysis. Please try again.'
            
            try {
              const errorData = await response.json()
              console.error('Delete failed:', errorData)
              
              // Handle different error response formats
              if (errorData.error && typeof errorData.error === 'string') {
                errorMessage = errorData.error
              } else if (errorData.message && typeof errorData.message === 'string') {
                errorMessage = errorData.message
              } else if (response.status === 404) {
                errorMessage = 'Analysis not found or already deleted.'
              } else if (response.status === 401) {
                errorMessage = 'You are not authorized to delete this analysis.'
              } else if (response.status === 403) {
                errorMessage = 'Access denied. You can only delete your own analyses.'
              }
            } catch (parseError) {
              console.error('Failed to parse error response:', parseError)
              // Use status-based error messages if JSON parsing fails
              if (response.status === 404) {
                errorMessage = 'Analysis not found or already deleted.'
              } else if (response.status === 401) {
                errorMessage = 'Authentication required. Please sign in again.'
              } else if (response.status === 403) {
                errorMessage = 'Access denied.'
              } else if (response.status >= 500) {
                errorMessage = 'Server error. Please try again later.'
              }
            }
            
            toast.error(errorMessage)
          }
        } catch (error) {
          console.error('Error deleting analysis:', error)
          let errorMessage = 'Failed to delete analysis. Please try again.'
          
          if (error instanceof Error) {
            if (error.message.includes('fetch')) {
              errorMessage = 'Network error. Please check your connection and try again.'
            } else {
              errorMessage = error.message
            }
          }
          
          toast.error(errorMessage)
        } finally {
          setDeletingId(null)
        }
      }
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  // Get score color
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get score badge variant
  const getScoreBadgeVariant = (score?: number) => {
    if (!score) return 'secondary'
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  // Get keyword match status
  const getKeywordMatchStatus = (percentage?: number) => {
    if (!percentage) return { text: 'No data available', color: 'text-gray-500' }
    if (percentage >= 70) return { text: 'Excellent keyword optimization', color: 'text-green-600' }
    if (percentage >= 40) return { text: 'Good match, room for improvement', color: 'text-yellow-600' }
    return { text: 'Needs significant keyword optimization', color: 'text-red-600' }
  }

  // Format category names
  const formatCategoryName = (category: string) => {
    return category
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  // Toggle card expansion
  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  // Modal handlers
  const openCoverLetterModal = (analysis: AnalysisResult) => {
    setSelectedAnalysis(analysis)
    setShowCoverLetterModal(true)
  }

  const openInterviewPrepModal = (analysis: AnalysisResult) => {
    setSelectedAnalysis(analysis)
    setShowInterviewPrepModal(true)
  }

  const openResumeOptimizationModal = (analysis: AnalysisResult) => {
    setSelectedAnalysis(analysis)
    setShowResumeOptimizationModal(true)
  }

  const handleOptimizationConfirm = async (selectedLLM: string) => {
    if (!selectedAnalysis) return
    
    try {
      setIsGeneratingOptimized(true)
      
      // Call the optimize-resume API
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: selectedAnalysis.data.resumeData,
          jobDescription: selectedAnalysis.data.jobDescription,
          analysisData: selectedAnalysis.data.analysis,
          analysisId: selectedAnalysis.id,
          llm: selectedLLM
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to optimize resume')
      }

      const result = await response.json()
      
      if (result.success) {
        const message = result.data.cached 
          ? 'Resume optimization retrieved from cache!'
          : 'Resume optimization generated successfully!'
        toast.success(message)
        
        // You could store the optimized resume data or navigate to a results page
        // For now, we'll just show success
      } else {
        throw new Error(result.error || 'Failed to optimize resume')
      }
      
      setShowResumeOptimizationModal(false)
    } catch (error) {
      console.error('Error generating optimized resume:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate optimized resume'
      toast.error(errorMessage)
    } finally {
      setIsGeneratingOptimized(false)
    }
  }

  const handleCoverLetterGenerated = (cached: boolean, usageCount: number) => {
    if (cached) {
      toast.success('Cover letter retrieved from cache!')
    } else {
      toast.success('New cover letter generated!')
    }
  }

  const getMaxPointsForCategory = (category: string): number => {
    switch (category) {
      case 'skills': return 40
      case 'experience': return 35
      case 'achievements': return 20
      case 'presentation': return 5
      default: return 100
    }
  }

  const calculateCategoryPercentage = (category: string, score: number): number => {
    const maxPoints = getMaxPointsForCategory(category)
    return Math.round((score / maxPoints) * 100)
  }

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

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Announcement */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-800">New Dashboard Features!</h3>
              <p className="text-sm text-green-700 mt-1">
                Now you can generate cover letters, prepare for interviews, and optimize your resume directly from your dashboard. 
                Each analysis card shows available features and their requirements.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search analyses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/90 backdrop-blur-sm border-orange-200 focus:border-orange-400 shadow-sm"
                />
              </div>
            </div>
            <Button 
              type="submit"
              variant="outline" 
              size="sm"
              className="bg-white/90 backdrop-blur-sm border-orange-200 hover:bg-orange-50 shadow-sm"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button 
              type="button"
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('')
                fetchAnalyses(1, '')
              }}
              className="bg-white/90 backdrop-blur-sm border-orange-200 hover:bg-orange-50 shadow-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </form>
        </div>

        {/* Analysis History */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Resume Analysis History</h2>
              <p className="text-gray-600 mt-1">View and manage your resume analysis results</p>
            </div>
            <div className="flex items-center space-x-3">
              {analyses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (expandedCards.size === analyses.length) {
                      setExpandedCards(new Set())
                    } else {
                      setExpandedCards(new Set(analyses.map(a => a.id)))
                    }
                  }}
                  className="bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-gray-50 shadow-sm"
                >
                  {expandedCards.size === analyses.length ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Expand All
                    </>
                  )}
                </Button>
              )}
              <Link href="/">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg">
                  <FileText className="h-4 w-4 mr-2" />
                  New Analysis
                </Button>
              </Link>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-white/90 backdrop-blur-sm border-gray-200 animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-6 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-20 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : analyses.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No analyses yet</h3>
                <p className="text-gray-600 mb-6">Get started by analyzing your first resume!</p>
                <div className="flex justify-center">
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg">
                      <FileText className="h-4 w-4 mr-2" />
                      Analyze Resume
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Dashboard Summary */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Overview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analyses.length}</div>
                      <div className="text-sm text-gray-600">Total Analyses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(analyses.reduce((sum, a) => sum + (a.overallScore || 0), 0) / analyses.length) || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Average Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {interviewPracticeCount}
                      </div>
                      <div className="text-sm text-gray-600">Interview Practice</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analyses.filter(a => (a.overallScore || 0) >= 80).length}
                      </div>
                      <div className="text-sm text-gray-600">High Scoring (80+%)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Credit Purchase Component for PLUS users */}
              <CreditPurchase className="mb-4" />

              {analyses.map((analysis) => {
                const isExpanded = expandedCards.has(analysis.id)
                
                return (
                  <Card key={analysis.id} className="bg-white/95 backdrop-blur-sm border border-gray-200/80 hover:border-orange-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Main Content */}
                      <div className="p-6">
                        {/* Header Row */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <Badge 
                                variant={getScoreBadgeVariant(analysis.overallScore)} 
                                className="text-sm font-semibold px-3 py-1"
                              >
                                {analysis.overallScore || 'N/A'}%
                              </Badge>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDate(analysis.createdAt)}
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                              {analysis.title || 'Resume Analysis'}
                            </h3>
                            
                            {/* Quick Feature Status */}
                            <div className="flex items-center space-x-4 text-xs">
                              <div className="flex items-center space-x-1">
                                <FileText className="h-3 w-3 text-purple-500" />
                                <span className={analysis.data.jobDescription ? 'text-purple-600' : 'text-gray-400'}>
                                  Cover Letter {analysis.data.jobDescription ? 'Available' : 'Needs Job Description'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Brain className="h-3 w-3 text-blue-500" />
                                <span className={analysis.data.jobDescription ? 'text-blue-600' : 'text-gray-400'}>
                                  Interview Prep {analysis.data.jobDescription ? 'Available' : 'Needs Job Description'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Sparkles className="h-3 w-3 text-orange-500" />
                                <span className="text-orange-600">Resume Optimization Available</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex items-center space-x-2 ml-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCardExpansion(analysis.id)}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!analysis.data.analysis) {
                                  alert('Analysis data is not available for this item.')
                                  return
                                }
                                
                                // Store core analysis data
                                sessionStorage.setItem('analysisResults', JSON.stringify(analysis.data.analysis))
                                sessionStorage.setItem('resumeData', JSON.stringify(analysis.data.resumeData))
                                sessionStorage.setItem('jobDescription', analysis.data.jobDescription || '')
                                sessionStorage.setItem('analysisId', analysis.id)
                                
                                if (analysis.documentId) {
                                  sessionStorage.setItem('documentId', analysis.documentId)
                                } else {
                                  sessionStorage.removeItem('documentId')
                                }
                                
                                if (analysis.pdfImages && analysis.pdfImages.length > 0) {
                                  sessionStorage.setItem('pdfImages', JSON.stringify(analysis.pdfImages))
                                } else {
                                  sessionStorage.removeItem('pdfImages')
                                }
                                
                                sessionStorage.setItem('isFromDashboard', 'true')
                                sessionStorage.setItem('dashboardAnalysisId', analysis.id)
                                
                                router.push('/analysis')
                              }}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(analysis.id)}
                              disabled={deletingId === analysis.id}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        {analysis.data.analysis && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                              <div className="flex items-center justify-between mb-2">
                                <Star className="h-5 w-5 text-green-600" />
                                <span className="text-2xl font-bold text-green-700">
                                  {analysis.data.analysis.strengths?.length || 0}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-green-700">Strengths</div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
                              <div className="flex items-center justify-between mb-2">
                                <Target className="h-5 w-5 text-red-600" />
                                <span className="text-2xl font-bold text-red-700">
                                  {analysis.data.analysis.weaknesses?.length || 0}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-red-700">Issues</div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                              <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                <span className="text-2xl font-bold text-blue-700">
                                  {analysis.data.analysis.suggestions?.length || 0}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-blue-700">Tips</div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                              <div className="flex items-center justify-between mb-2">
                                <Search className="h-5 w-5 text-orange-600" />
                                <span className="text-2xl font-bold text-orange-700">
                                  {analysis.data.analysis.keywordMatch?.matchPercentage || 0}%
                                </span>
                              </div>
                              <div className="text-sm font-medium text-orange-700">Match</div>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {analysis.data.analysis && analysis.data.resumeData && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                            <Button 
                              variant="outline" 
                              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300" 
                              size="sm"
                              onClick={() => openCoverLetterModal(analysis)}
                              disabled={!analysis.data.jobDescription}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Generate Cover Letter
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300" 
                              size="sm"
                              onClick={() => openInterviewPrepModal(analysis)}
                              disabled={!analysis.data.jobDescription}
                            >
                              <Brain className="h-4 w-4 mr-2" />
                              Interview Prep
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300" 
                              size="sm"
                              onClick={() => openResumeOptimizationModal(analysis)}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Optimize Resume
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50/50">
                          <div className="p-6 space-y-8">
                            {/* Detailed Score Breakdown */}
                            {analysis.data.analysis?.scoringBreakdown ? (
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                  <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                                  Score Breakdown
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {Object.entries(analysis.data.analysis.scoringBreakdown).map(([category, score]) => {
                                    const percentage = calculateCategoryPercentage(category, Number(score))
                                    return (
                                      <div key={category} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                        <div className="text-sm font-medium text-gray-700 mb-3">
                                          {formatCategoryName(category)}
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900 mb-3">
                                          {percentage}%
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                              percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                              percentage >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                                              'bg-gradient-to-r from-red-500 to-pink-500'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                  <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                                  Score Breakdown
                                </h4>
                                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <FileText className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <p className="text-gray-600">Detailed score breakdown not available</p>
                                </div>
                              </div>
                            )}

                            {/* Keyword Match Section */}
                            {analysis.data.analysis?.keywordMatch ? (
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                  <Search className="h-5 w-5 mr-2 text-gray-600" />
                                  Keyword Match Analysis
                                </h4>
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-medium text-gray-700">Resume-Job Match Rate</span>
                                    <span className="text-lg font-bold text-gray-900">
                                      {analysis.data.analysis.keywordMatch.matchPercentage}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                    <div 
                                      className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700"
                                      style={{ width: `${analysis.data.analysis.keywordMatch.matchPercentage}%` }}
                                    ></div>
                                  </div>
                                  <p className={`text-sm font-medium ${getKeywordMatchStatus(analysis.data.analysis.keywordMatch.matchPercentage).color}`}>
                                    {getKeywordMatchStatus(analysis.data.analysis.keywordMatch.matchPercentage).text}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                  <Search className="h-5 w-5 mr-2 text-gray-600" />
                                  Keyword Match Analysis
                                </h4>
                                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Search className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <p className="text-gray-600">Keyword analysis not available</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="bg-white hover:bg-gray-50 border-gray-300"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                          className="bg-white hover:bg-gray-50 border-gray-300"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Alert Dialog */}
      {AlertDialog}
      
      {/* Cover Letter Modal */}
      <CoverLetterModal
        isOpen={showCoverLetterModal}
        onClose={() => setShowCoverLetterModal(false)}
        resumeData={selectedAnalysis?.data.resumeData}
        jobDescription={selectedAnalysis?.data.jobDescription}
        analysisData={selectedAnalysis?.data.analysis}
        analysisId={selectedAnalysis?.id}
        onCoverLetterGenerated={handleCoverLetterGenerated}
      />

      {/* Interview Prep Modal */}
      <InterviewPrepModal
        isOpen={showInterviewPrepModal}
        onClose={() => setShowInterviewPrepModal(false)}
        resumeData={selectedAnalysis?.data.resumeData}
        jobDescription={selectedAnalysis?.data.jobDescription}
        analysisData={selectedAnalysis?.data.analysis}
        analysisId={selectedAnalysis?.id}
      />

      {/* Resume Optimization Modal */}
      <ResumeOptimizationModal
        isOpen={showResumeOptimizationModal}
        onClose={() => setShowResumeOptimizationModal(false)}
        onConfirm={handleOptimizationConfirm}
        isGenerating={isGeneratingOptimized}
      />
      
      <Footer />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
} 