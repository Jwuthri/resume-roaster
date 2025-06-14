'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, XCircle, Clock, User, AlertTriangle, Image, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SharedAnalysisData {
  analysis: {
    overallScore: number
    scoreLabel: string
    scoringBreakdown?: {
      skills: number
      experience: number
      achievements: number
      presentation: number
    }
    scoreJustification?: string
    strengths: string[]
    weaknesses: string[]
    suggestions: Array<{
      section: string
      issue: string
      solution: string
      priority: 'high' | 'medium' | 'low'
    }>
    keywordMatch: {
      matched: string[]
      missing: string[]
      matchPercentage?: number
    }
    atsIssues: string[]
  }
  resumeData?: any
  jobDescription?: string
  pdfImages?: string[]
  metadata: {
    sharedBy: string
    sharedAt: string
    viewCount: number
    settings: any
  }
}

export default function SharedAnalysisPage() {
  const params = useParams()
  const shareId = params.shareId as string
  const [data, setData] = useState<SharedAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (!shareId) return

    const fetchSharedAnalysis = async () => {
      try {
        const response = await fetch(`/api/shared/${shareId}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch shared analysis')
        }

        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSharedAnalysis()
  }, [shareId])

  // Handle PDF image modal
  const handleOpenImageModal = () => {
    if (data?.pdfImages && data.pdfImages.length > 0) {
      setCurrentImageIndex(0)
      setShowImageModal(true)
    }
  }

  const handleCloseImageModal = () => {
    setShowImageModal(false)
    setCurrentImageIndex(0)
  }

  const handlePreviousImage = () => {
    if (data?.pdfImages) {
      setCurrentImageIndex(prev => prev > 0 ? prev - 1 : data.pdfImages!.length - 1)
    }
  }

  const handleNextImage = () => {
    if (data?.pdfImages) {
      setCurrentImageIndex(prev => prev < data.pdfImages!.length - 1 ? prev + 1 : 0)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shared analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-6">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Analysis</h1>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { analysis, metadata } = data

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Analysis Report</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Shared by {metadata.sharedBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Viewed {metadata.viewCount} times</span>
            </div>
          </div>
        </div>

        {/* PDF Images Section */}
        {data.pdfImages && data.pdfImages.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Image className="h-6 w-6 text-blue-500" />
                <span>Original Resume</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleOpenImageModal}
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
                >
                  <Image className="h-4 w-4 mr-2" />
                  View Resume ({data.pdfImages.length} page{data.pdfImages.length > 1 ? 's' : ''})
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Description Section */}
        {data.jobDescription && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-purple-500" />
                <span>Target Job Description</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {data.jobDescription}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overall Score */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold mb-4 ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}
            </div>
            <p className="text-xl font-semibold text-gray-700">{analysis.scoreLabel}</p>
          </CardContent>
        </Card>

        {/* Score Explanation */}
        {analysis.scoreJustification && (
          <Card className="mb-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-orange-700">Score Explanation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysis.scoreJustification}
                  </ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strengths */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Specific Recommendations */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Specific Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{suggestion.section}</h4>
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2"><strong>Issue:</strong> {suggestion.issue}</p>
                  <p className="text-gray-700"><strong>Solution:</strong> {suggestion.solution}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Keyword Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Keyword Analysis</CardTitle>
            {analysis.keywordMatch.matchPercentage !== undefined && (
              <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Match Rate</span>
                  <span className={`text-lg font-bold ${
                    analysis.keywordMatch.matchPercentage >= 70 
                      ? 'text-green-600' 
                      : analysis.keywordMatch.matchPercentage >= 50
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}>
                    {Math.round(analysis.keywordMatch.matchPercentage || 0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {analysis.keywordMatch.matchPercentage >= 70 
                    ? 'Excellent keyword optimization!' 
                    : analysis.keywordMatch.matchPercentage >= 50
                      ? 'Good match, but room for improvement'
                      : 'Needs significant keyword optimization'
                  }
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Matched Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordMatch.matched?.length > 0 ? (
                    analysis.keywordMatch.matched.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">None identified</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Missing Keywords
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordMatch.missing?.length > 0 ? (
                    analysis.keywordMatch.missing.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">None identified</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ATS Issues */}
        {analysis.atsIssues?.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                ATS Compatibility Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.atsIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>This analysis was generated by Resume Roaster - AI-powered resume optimization</p>
          <p className="mt-1">Analysis shared on {new Date(metadata.sharedAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* PDF Images Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Image className="h-5 w-5" />
                <span>Resume Preview - Page {currentImageIndex + 1} of {data?.pdfImages?.length || 0}</span>
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-1 p-6 pt-2">
            {data?.pdfImages && data.pdfImages.length > 0 && (
              <div className="relative">
                {/* Main Image */}
                <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4 min-h-[400px]">
                  <img
                    src={`data:image/png;base64,${data.pdfImages[currentImageIndex]}`}
                    alt={`Resume Page ${currentImageIndex + 1}`}
                    className="max-w-full max-h-[60vh] object-contain shadow-lg rounded"
                  />
                </div>
                
                {/* Navigation Arrows */}
                {data.pdfImages.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
                
                {/* Page Indicators */}
                {data.pdfImages.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {data.pdfImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex 
                            ? 'bg-blue-600' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 