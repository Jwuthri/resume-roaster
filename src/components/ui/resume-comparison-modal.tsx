"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from "./dialog"
import { Button } from "./button"
import { Badge } from "./badge"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { ScrollArea } from "./scroll-area"
import { 
  X, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Target,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react"
import { ResumeData, getTemplateById } from "@/lib/resume-templates"
import { generatePDF, downloadBlob } from "@/lib/document-generators"
import { toast } from 'sonner'

interface OptimizedResumeData {
  id: string
  templateId: string
  content: string
  data: ResumeData
  images: string[]
  atsScore: number | null
  keywordsMatched: string[]
  overallScore: number | null
  scoringBreakdown: any
  scoreLabel: string | null
  keywordMatchPercentage: number | null
  originalAtsScore: number | null
  createdAt: string
}

interface ResumeComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  analysisId: string
  originalResumeData: ResumeData | null
  jobDescription: string
  analysisData: any
  pdfImages?: string[]
}

export function ResumeComparisonModal({
  isOpen,
  onClose,
  analysisId,
  originalResumeData,
  jobDescription,
  analysisData,
  pdfImages
}: ResumeComparisonModalProps) {
  

  const [optimizedResume, setOptimizedResume] = useState<OptimizedResumeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'original' | 'optimized' | 'analysis'>('side-by-side')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('ResumeComparisonModal opened with data:', {
        analysisId,
        originalResumeData,
        jobDescription,
        analysisData,
        pdfImages: pdfImages?.length || 0
      })
      
      // Check if originalResumeData has the expected structure
      if (originalResumeData) {
        console.log('Original resume data structure:', {
          hasPersonalInfo: !!originalResumeData.personalInfo,
          personalInfoKeys: originalResumeData.personalInfo ? Object.keys(originalResumeData.personalInfo) : [],
          name: originalResumeData.personalInfo?.name,
          hasExperience: !!originalResumeData.experience,
          hasEducation: !!originalResumeData.education,
          hasSkills: !!originalResumeData.skills
        })
      }
      
      if (pdfImages) {
        console.log('PDF Images available:', pdfImages.length)
      }
    }
  }, [isOpen, analysisId, originalResumeData, jobDescription, analysisData, pdfImages])

  // Fetch optimized resume when modal opens
  useEffect(() => {
    if (isOpen && analysisId) {
      fetchOptimizedResume()
    }
  }, [isOpen, analysisId])

  const fetchOptimizedResume = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/optimized-resume/${analysisId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch optimized resume')
      }

      if (result.data.exists) {
        setOptimizedResume(result.data.optimizedResume)
      } else {
        setError('No optimized resume found for this analysis')
      }
    } catch (error) {
      console.error('Error fetching optimized resume:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch optimized resume')
    } finally {
      setLoading(false)
    }
  }

  const generateOriginalResumeHTML = () => {
    if (!originalResumeData) return '<p>Original resume data not available</p>'
    
    // Use the classic template for original resume display
    const template = getTemplateById('your-resume-style')
    if (!template) return '<p>Template not found</p>'
    
    // Validate and sanitize the resume data to prevent template errors
    const sanitizedData = {
      personalInfo: {
        name: originalResumeData.personalInfo?.name || 'Name Not Available',
        email: originalResumeData.personalInfo?.email || '',
        phone: originalResumeData.personalInfo?.phone || '',
        location: originalResumeData.personalInfo?.location || '',
        linkedin: originalResumeData.personalInfo?.linkedin || '',
        portfolio: originalResumeData.personalInfo?.portfolio || '',
        github: originalResumeData.personalInfo?.github || '',
        jobTitle: originalResumeData.personalInfo?.jobTitle || '',
        jobDescription: originalResumeData.personalInfo?.jobDescription || ''
      },
      summary: originalResumeData.summary || '',
      experience: Array.isArray(originalResumeData.experience) ? originalResumeData.experience : [],
      education: Array.isArray(originalResumeData.education) ? originalResumeData.education : [],
      skills: {
        technical: Array.isArray(originalResumeData.skills?.technical) ? originalResumeData.skills.technical : [],
        soft: Array.isArray(originalResumeData.skills?.soft) ? originalResumeData.skills.soft : [],
        languages: Array.isArray(originalResumeData.skills?.languages) ? originalResumeData.skills.languages : [],
        certifications: Array.isArray(originalResumeData.skills?.certifications) ? originalResumeData.skills.certifications : []
      },
      projects: Array.isArray(originalResumeData.projects) ? originalResumeData.projects : [],
      publications: Array.isArray(originalResumeData.publications) ? originalResumeData.publications : [],
      training: Array.isArray(originalResumeData.training) ? originalResumeData.training : []
    }
    
    try {
      return template.generateHTML(sanitizedData)
    } catch (error) {
      console.error('Error generating original resume HTML:', error)
      return '<p>Error generating resume preview. Please check the resume data.</p>'
    }
  }

  const generateOptimizedResumeHTML = (resumeData: ResumeData) => {
    // Use the classic template for optimized resume display
    const template = getTemplateById('your-resume-style')
    if (!template) return '<p>Template not found</p>'
    
    // Validate and sanitize the resume data to prevent template errors
    const sanitizedData = {
      personalInfo: {
        name: resumeData.personalInfo?.name || 'Name Not Available',
        email: resumeData.personalInfo?.email || '',
        phone: resumeData.personalInfo?.phone || '',
        location: resumeData.personalInfo?.location || '',
        linkedin: resumeData.personalInfo?.linkedin || '',
        portfolio: resumeData.personalInfo?.portfolio || '',
        github: resumeData.personalInfo?.github || '',
        jobTitle: resumeData.personalInfo?.jobTitle || '',
        jobDescription: resumeData.personalInfo?.jobDescription || ''
      },
      summary: resumeData.summary || '',
      experience: Array.isArray(resumeData.experience) ? resumeData.experience : [],
      education: Array.isArray(resumeData.education) ? resumeData.education : [],
      skills: {
        technical: Array.isArray(resumeData.skills?.technical) ? resumeData.skills.technical : [],
        soft: Array.isArray(resumeData.skills?.soft) ? resumeData.skills.soft : [],
        languages: Array.isArray(resumeData.skills?.languages) ? resumeData.skills.languages : [],
        certifications: Array.isArray(resumeData.skills?.certifications) ? resumeData.skills.certifications : []
      },
      projects: Array.isArray(resumeData.projects) ? resumeData.projects : [],
      publications: Array.isArray(resumeData.publications) ? resumeData.publications : [],
      training: Array.isArray(resumeData.training) ? resumeData.training : []
    }
    
    try {
      const htmlContent = template.generateHTML(sanitizedData)
      
      // Extract only the body content to avoid CSS conflicts
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent
      
      // Return clean body content without interfering styles
      return bodyContent
    } catch (error) {
      console.error('Error generating optimized resume HTML:', error)
      return '<p>Error generating resume preview. Please check the resume data.</p>'
    }
  }

  const handleDownloadOriginal = async () => {
    if (!originalResumeData) {
      toast.error('Original resume data not available')
      return
    }

    try {
      const htmlContent = generateOriginalResumeHTML()
      const fileName = `${originalResumeData.personalInfo?.name || 'Resume'}_Original_Resume.pdf`
      const pdfBlob = await generatePDF(originalResumeData, htmlContent)
      downloadBlob(pdfBlob, fileName)
      toast.success('Original resume downloaded successfully!')
    } catch (error) {
      console.error('Error downloading original resume:', error)
      toast.error('Failed to download original resume')
    }
  }

  const handleDownloadOptimized = async () => {
    if (!optimizedResume) {
      toast.error('Optimized resume not available')
      return
    }

    try {
      const fileName = `${optimizedResume.data.personalInfo?.name || 'Resume'}_Optimized_Resume.pdf`
      const pdfBlob = await generatePDF(optimizedResume.data, optimizedResume.content)
      downloadBlob(pdfBlob, fileName)
      toast.success('Optimized resume downloaded successfully!')
    } catch (error) {
      console.error('Error downloading optimized resume:', error)
      toast.error('Failed to download optimized resume')
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500'
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number | null) => {
    if (!score) return 'secondary'
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  const handlePrevImage = () => {
    if (pdfImages && pdfImages.length > 0) {
      setCurrentImageIndex(prev => prev > 0 ? prev - 1 : pdfImages.length - 1)
    }
  }

  const handleNextImage = () => {
    if (pdfImages && pdfImages.length > 0) {
      setCurrentImageIndex(prev => prev < pdfImages.length - 1 ? prev + 1 : 0)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent 
          className={`${isFullscreen ? 'max-w-[98vw] h-[98vh]' : 'max-w-[90vw] h-[90vh]'} p-0 flex flex-col bg-white fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] border shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg`}
        >
        <DialogHeader className="p-4 pb-3 border-b bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-600" />
                Resume Comparison
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Compare your original resume with the AI-optimized version
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {(!originalResumeData && (!pdfImages || pdfImages.length === 0)) ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-yellow-600" />
                </div>
                <p className="text-yellow-600 font-medium mb-2">Original Resume Data Missing</p>
                <p className="text-gray-600">The original resume data is not available for comparison.</p>
                <p className="text-gray-500 text-sm mt-2">Please try re-analyzing your resume.</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading optimized resume...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-red-600 font-medium mb-2">Error</p>
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          ) : optimizedResume ? (
            <div className="h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
                <div className="px-4 py-3 border-b bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <TabsList className="grid w-fit grid-cols-4">
                      <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                      <TabsTrigger value="original">Original</TabsTrigger>
                      <TabsTrigger value="optimized">Optimized</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    </TabsList>
                    
                    {optimizedResume && (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Overall Score:</span>
                          <Badge variant={getScoreBadgeVariant(optimizedResume.overallScore)} className={getScoreColor(optimizedResume.overallScore)}>
                            {optimizedResume.overallScore || 'N/A'}
                          </Badge>
                          {optimizedResume.originalAtsScore && (
                            <>
                              <span className="text-sm text-gray-500">→</span>
                              <Badge variant="outline" className="text-gray-600">
                                {optimizedResume.originalAtsScore} (original)
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">ATS Score:</span>
                          <Badge variant={getScoreBadgeVariant(optimizedResume.atsScore)} className={getScoreColor(optimizedResume.atsScore)}>
                            {optimizedResume.atsScore || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Keywords:</span>
                          <Badge variant="outline">
                            {optimizedResume.keywordsMatched.length} matched
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <TabsContent value="side-by-side" className="flex-1 m-0 p-0 overflow-hidden">
                  <div className="flex h-full">
                    {/* Original Resume */}
                    <div className="flex-1 border-r flex flex-col">
                      <div className="p-3 border-b bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium flex items-center text-sm">
                            <ImageIcon className="h-4 w-4 mr-2 text-gray-600" />
                            Original Resume
                            {pdfImages && pdfImages.length > 1 && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({currentImageIndex + 1}/{pdfImages.length})
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {pdfImages && pdfImages.length > 1 && (
                              <>
                                <Button variant="ghost" size="sm" onClick={handlePrevImage}>
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleNextImage}>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="outline" size="sm" onClick={handleDownloadOriginal}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto bg-gray-100 p-4">
                        {pdfImages && pdfImages.length > 0 ? (
                          <div className="flex justify-center">
                            <img
                              src={`data:image/png;base64,${pdfImages[currentImageIndex]}`}
                              alt={`Resume page ${currentImageIndex + 1}`}
                              className="max-w-full h-auto shadow-lg rounded-lg border"
                              style={{ maxHeight: 'none' }}
                            />
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 mt-8">
                            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>No PDF images available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Optimized Resume */}
                    <div className="flex-1 flex flex-col">
                      <div className="p-3 border-b bg-green-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium flex items-center text-sm">
                            <Sparkles className="h-4 w-4 mr-2 text-green-600" />
                            Optimized Resume
                          </h3>
                          <Button variant="outline" size="sm" onClick={handleDownloadOptimized}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto bg-gray-100 p-4">
                        <div className="flex justify-center">
                          {optimizedResume.images && optimizedResume.images.length > 0 ? (
                            <img
                              src={`data:image/png;base64,${optimizedResume.images[0]}`}
                              alt="Optimized resume"
                              className="max-w-full h-auto shadow-lg rounded-lg border"
                              style={{ maxHeight: 'none' }}
                            />
                          ) : (
                            <div 
                              className="resume-content bg-white shadow-lg rounded-lg border max-w-full h-auto"
                              style={{ 
                                fontFamily: 'inherit',
                                lineHeight: '1.5',
                                color: '#333',
                                width: 'auto',
                                maxWidth: '100%',
                                padding: '2rem',
                                isolation: 'isolate',
                                contain: 'layout style'
                              }}
                              dangerouslySetInnerHTML={{ __html: optimizedResume.content || generateOptimizedResumeHTML(optimizedResume.data) }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="original" className="flex-1 m-0 p-0 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="p-3 border-b bg-gray-50 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center text-sm">
                          <ImageIcon className="h-4 w-4 mr-2 text-gray-600" />
                          Original Resume
                          {pdfImages && pdfImages.length > 1 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({currentImageIndex + 1}/{pdfImages.length})
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {pdfImages && pdfImages.length > 1 && (
                            <>
                              <Button variant="ghost" size="sm" onClick={handlePrevImage}>
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleNextImage}>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={handleDownloadOriginal}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-gray-100 p-4">
                      {pdfImages && pdfImages.length > 0 ? (
                        <div className="flex justify-center">
                          <img
                            src={`data:image/png;base64,${pdfImages[currentImageIndex]}`}
                            alt={`Resume page ${currentImageIndex + 1}`}
                            className="max-w-full h-auto shadow-lg rounded-lg border"
                            style={{ maxHeight: 'none' }}
                          />
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 mt-8">
                          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>No PDF images available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="optimized" className="flex-1 m-0 p-0 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="p-3 border-b bg-green-50 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium flex items-center text-sm">
                          <Sparkles className="h-4 w-4 mr-2 text-green-600" />
                          Optimized Resume
                        </h3>
                        <Button variant="outline" size="sm" onClick={handleDownloadOptimized}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto bg-gray-100 p-4">
                      <div className="flex justify-center">
                        {optimizedResume.images && optimizedResume.images.length > 0 ? (
                          <img
                            src={`data:image/png;base64,${optimizedResume.images[0]}`}
                            alt="Optimized resume"
                            className="max-w-full h-auto shadow-lg rounded-lg border"
                            style={{ maxHeight: 'none' }}
                          />
                        ) : (
                          <div 
                            className="resume-content bg-white shadow-lg rounded-lg border max-w-full h-auto"
                            style={{ 
                              fontFamily: 'inherit',
                              lineHeight: '1.5',
                              color: '#333',
                              width: 'auto',
                              maxWidth: '100%',
                              padding: '2rem',
                              isolation: 'isolate',
                              contain: 'layout style'
                            }}
                            dangerouslySetInnerHTML={{ __html: optimizedResume.content || generateOptimizedResumeHTML(optimizedResume.data) }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="flex-1 m-0 p-0 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="p-3 border-b bg-blue-50 flex-shrink-0">
                      <h3 className="font-medium flex items-center text-sm">
                        <Target className="h-4 w-4 mr-2 text-blue-600" />
                        Job Description & Analysis
                      </h3>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-6">
                        {/* Job Description Section */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <FileText className="h-5 w-5 mr-2 text-blue-600" />
                              Target Job Description
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="prose prose-sm max-w-none">
                              <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg border">
                                {jobDescription || 'No job description provided'}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Score Comparison Section */}
                        {optimizedResume && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                                Score Improvement Analysis
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Overall Score */}
                                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-blue-900">Overall Score</span>
                                    <div className="flex items-center space-x-2">
                                      {analysisData?.overallScore && (
                                        <>
                                          <Badge variant="outline" className="text-gray-600">
                                            {analysisData.overallScore} (original)
                                          </Badge>
                                          <span className="text-green-600">→</span>
                                        </>
                                      )}
                                      <Badge variant={getScoreBadgeVariant(optimizedResume.overallScore)} className={getScoreColor(optimizedResume.overallScore)}>
                                        {optimizedResume.overallScore || 'N/A'}
                                      </Badge>
                                    </div>
                                  </div>
                                  {optimizedResume.scoreLabel && (
                                    <p className="text-sm text-blue-700">{optimizedResume.scoreLabel}</p>
                                  )}
                                </div>

                                {/* ATS Compatibility */}
                                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-green-900">ATS Compatibility</span>
                                    <div className="flex items-center space-x-2">
                                      {optimizedResume.originalAtsScore && (
                                        <>
                                          <Badge variant="outline" className="text-gray-600">
                                            {optimizedResume.originalAtsScore}% (original)
                                          </Badge>
                                          <span className="text-green-600">→</span>
                                        </>
                                      )}
                                      <Badge variant={getScoreBadgeVariant(optimizedResume.atsScore)} className={getScoreColor(optimizedResume.atsScore)}>
                                        {optimizedResume.atsScore || 'N/A'}%
                                      </Badge>
                                    </div>
                                  </div>
                                  <p className="text-sm text-green-700">
                                    {Math.round(optimizedResume.keywordMatchPercentage || 0)}% keyword match rate
                                  </p>
                                </div>
                              </div>

                              {/* Detailed Scoring Breakdown */}
                              {optimizedResume.scoringBreakdown && (
                                <div className="mt-6">
                                  <h4 className="font-medium text-gray-900 mb-3">Detailed Score Breakdown</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                                      <div className="text-2xl font-bold text-blue-600">
                                        {optimizedResume.scoringBreakdown.skills || 0}
                                      </div>
                                      <div className="text-sm text-gray-600">Skills (40)</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                                      <div className="text-2xl font-bold text-green-600">
                                        {optimizedResume.scoringBreakdown.experience || 0}
                                      </div>
                                      <div className="text-sm text-gray-600">Experience (35)</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                                      <div className="text-2xl font-bold text-purple-600">
                                        {optimizedResume.scoringBreakdown.achievements || 0}
                                      </div>
                                      <div className="text-sm text-gray-600">Achievements (20)</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg border">
                                      <div className="text-2xl font-bold text-orange-600">
                                        {optimizedResume.scoringBreakdown.presentation || 0}
                                      </div>
                                      <div className="text-sm text-gray-600">Presentation (5)</div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Keywords Analysis */}
                              <div className="mt-6">
                                <h4 className="font-medium text-gray-900 mb-3">Keywords Matched</h4>
                                <div className="flex flex-wrap gap-2">
                                  {optimizedResume.keywordsMatched.map((keyword, index) => (
                                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      {keyword}
                                    </Badge>
                                  ))}
                                  {optimizedResume.keywordsMatched.length === 0 && (
                                    <span className="text-gray-500 text-sm">No keywords data available</span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-2">No Optimized Resume</p>
                <p className="text-gray-500">No optimized resume found for this analysis.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      </DialogPortal>
    </Dialog>
  )
} 