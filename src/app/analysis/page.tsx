"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAlertDialog } from "@/components/ui/alert-dialog"
import { ResumeOptimizationLoading } from "../../components/ui/resume-optimizer-loading"
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  Target, 
  FileText, 
  Zap,
  ArrowRight,
  Download,
  Share2,
  Sparkles,
  Flame,
  Crown,
  Star,
  XCircle,
  Image,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Info,
  RefreshCw,
  Linkedin,
  Brain
} from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from "next/link"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { useAnalysisActions } from "@/hooks/useAnalysisActions"
import { useSubscription } from "@/hooks/useSubscription"
import { Footer } from "@/components/ui/footer"
import { CoverLetterModal } from "@/components/ui/cover-letter-modal"
import { Navigation } from "@/components/ui/navigation"
import { ResumeOptimizationModal } from "@/components/ui/resume-optimization-modal"
import { InterviewPrepModal } from "@/components/ui/interview-prep-modal"

interface AnalysisData {
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
  atsIssues?: string[]
}

export default function AnalysisPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [resumeData, setResumeData] = useState<any>(null)
  const [jobDescription, setJobDescription] = useState<string | undefined>(undefined)
  const [roastId, setRoastId] = useState<string | undefined>(undefined)
  const [documentId, setDocumentId] = useState<string | undefined>(undefined)
  const [isGeneratingOptimized, setIsGeneratingOptimized] = useState(false)
  const [hasOptimizedResume, setHasOptimizedResume] = useState(false)
  const [hasCoverLetter, setHasCoverLetter] = useState(false)
  const [hasInterviewPrep, setHasInterviewPrep] = useState(false)
  const [isDebugExpanded, setIsDebugExpanded] = useState(false)
  const [pdfImages, setPdfImages] = useState<string[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false)
  const [showResumeOptimizationModal, setShowResumeOptimizationModal] = useState(false)
  const [showInterviewPrepModal, setShowInterviewPrepModal] = useState(false)
  
  const { downloadReport, shareAnalysis, isDownloading, isSharing } = useAnalysisActions()
  const { subscription } = useSubscription()
  const router = useRouter()
  const { showAlert, AlertDialog } = useAlertDialog()

  // Check for existing optimized resume and cover letter in database
  useEffect(() => {
    const checkExistingContent = async () => {
      if (!roastId) return

      try {
        // Check for existing optimized resume
        console.log('🔍 Checking for existing optimized resume for analysis:', roastId)
        const optimizedResponse = await fetch(`/api/check-generated-content?analysisId=${roastId}&type=resume`)
        if (optimizedResponse.ok) {
          const optimizedResult = await optimizedResponse.json()
          console.log('✅ Optimized resume check result:', optimizedResult)
          setHasOptimizedResume(optimizedResult.exists)
        } else {
          console.error('❌ Failed to check optimized resume:', optimizedResponse.status)
        }

        // Check for existing cover letter
        const coverLetterResponse = await fetch(`/api/check-generated-content?analysisId=${roastId}&type=cover-letter`)
        if (coverLetterResponse.ok) {
          const coverLetterResult = await coverLetterResponse.json()
          setHasCoverLetter(coverLetterResult.exists)
        }

        // Check for existing interview prep
        const interviewPrepResponse = await fetch(`/api/check-generated-content?analysisId=${roastId}&type=interview-prep`)
        if (interviewPrepResponse.ok) {
          const interviewPrepResult = await interviewPrepResponse.json()
          setHasInterviewPrep(interviewPrepResult.exists)
        }
      } catch (error) {
        console.error('Error checking existing content:', error)
      }
    }

    checkExistingContent()
  }, [roastId])

  // Handle generating optimized version - shows LLM selection modal
  const handleGenerateOptimized = async () => {
    // Check if we have analysis data
    if (!analysisData) {
      showAlert({
        title: "Analysis Data Missing",
        description: "Analysis data not available. Please try analyzing your resume again.",
        type: "warning",
        confirmText: "Go Back",
        onConfirm: () => router.push('/')
      })
      return
    }

    // Check if we have roastId - this is critical for the API call
    if (!roastId) {
      console.error('❌ Roast ID missing when trying to optimize resume')
      console.log('Current roastId:', roastId)
      console.log('Checking sessionStorage for roastId...')
      
      // Try to get it from sessionStorage again
      const storedRoastId = sessionStorage.getItem('roastId')
      const dashboardRoastId = sessionStorage.getItem('dashboardRoastId')
      
      console.log('Stored roastId:', storedRoastId)
      console.log('Dashboard roastId:', dashboardRoastId)
      
      if (storedRoastId) {
        setRoastId(storedRoastId)
        console.log('✅ Found roastId in sessionStorage, retrying...')
        // Retry the function after setting the ID
        setTimeout(() => handleGenerateOptimized(), 100)
        return
      } else if (dashboardRoastId) {
        setRoastId(dashboardRoastId)
        console.log('✅ Found dashboard roastId in sessionStorage, retrying...')
        // Retry the function after setting the ID
        setTimeout(() => handleGenerateOptimized(), 100)
        return
      } else {
        showAlert({
          title: "Roast ID Missing",
          description: "Roast ID is required for resume optimization. Would you like to go to Resume Optimizer to enter your details manually instead?",
          type: "warning",
          confirmText: "Go to Resume Optimizer",
          cancelText: "Try Again",
          showCancel: true,
          onConfirm: () => router.push('/resume-optimizer'),
          onCancel: () => {
            // Try to reload the page data
            window.location.reload()
          }
        })
        return
      }
    }

    // Check if we have resume data, if not, provide options
    if (!resumeData) {
      showAlert({
        title: "Resume Text Not Found",
        description: "Resume text not found in session. Would you like to go to Resume Optimizer and enter your details manually, or upload and analyze your resume first?",
        type: "warning",
        confirmText: "Go to Resume Optimizer",
        cancelText: "Upload Resume First",
        showCancel: true,
        onConfirm: () => router.push('/resume-optimizer'),
        onCancel: () => router.push('/')
      })
      return
    }

    // Show the LLM selection modal
    setShowResumeOptimizationModal(true)
  }

  // Handle LLM selection and proceed with optimization
  const handleOptimizationConfirm = async (selectedLLM: string) => {
    setShowResumeOptimizationModal(false)
    setIsGeneratingOptimized(true)
    
    try {
      // Prepare resume text - handle different possible formats
      let resumeText = ''
      if (typeof resumeData === 'string') {
        resumeText = resumeData
      } else if (resumeData.text) {
        resumeText = resumeData.text
      } else if (resumeData.extractedText) {
        resumeText = resumeData.extractedText
      } else if (resumeData.content) {
        resumeText = resumeData.content
      } else {
        // If we still don't have text, create a basic structure from analysis
        resumeText = `Resume Analysis Results:
        
Overall Score: ${analysisData?.overallScore}/100
Strengths: ${analysisData?.strengths.join(', ')}
Areas for Improvement: ${analysisData?.weaknesses.join(', ')}

Note: Original resume text was not available, using analysis data for optimization.`
      }

      // Check if we have existing optimized resume
      if (hasOptimizedResume) {
        showAlert({
          title: "🚀 Existing Optimized Resume Found!",
          description: "Found an existing optimized resume for this analysis! Would you like to use the existing one or generate a new one?",
          type: "info",
          confirmText: "Use Existing (Instant)",
          cancelText: "Generate New",
          showCancel: true,
          onConfirm: () => {
            // Continue with existing data
            proceedWithExistingData()
          },
          onCancel: () => {
            // User wants fresh processing
            proceedWithFreshExtraction(resumeText, selectedLLM, true) // Pass bypassCache=true
          }
        })
        return
      }
      
      // No existing data, proceed with fresh extraction
      await proceedWithFreshExtraction(resumeText, selectedLLM, false)
      
    } catch (error) {
      console.error('Error generating optimized version:', error)
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to generate optimized version.'
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Please sign in to use the AI optimization feature.'
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'AI service is busy. Please try again in a few minutes.'
        } else if (error.message.includes('API key')) {
          errorMessage = 'AI service is temporarily unavailable. Please try again later.'
        } else {
          errorMessage = error.message
        }
      }
      
      showAlert({
        title: "Optimization Failed",
        description: `${errorMessage}\n\nWould you like to go to Resume Optimizer to enter your details manually instead?`,
        type: "error",
        confirmText: "Go to Resume Optimizer",
        cancelText: "Try Again Later",
        showCancel: true,
        onConfirm: () => router.push('/resume-optimizer')
      })
    } finally {
      setIsGeneratingOptimized(false)
    }
  }

  // Helper function to proceed with existing data
  const proceedWithExistingData = () => {
    // Store the analysis data for the resume optimizer
    sessionStorage.setItem('roastId', roastId || '')
    sessionStorage.setItem('isFromAnalysis', 'true')
    if (jobDescription) {
      sessionStorage.setItem('analysisJobDescription', jobDescription)
    }
    
    // Redirect to Resume Optimizer with prefilled parameter
    router.push('/resume-optimizer?prefilled=true')
  }

  // Helper function to proceed with fresh extraction
  const proceedWithFreshExtraction = async (resumeText: string, selectedLLM: string, bypassCache: boolean = false) => {
    if (bypassCache) {
      console.log('🔄 FORCE REGENERATION: Running fresh AI optimization (bypassing existing data)...')
    } else {
      console.log('No existing data found - running AI optimization...')
    }
    
    // Call the optimization API with roastId instead of raw text
    const response = await fetch('/api/optimize-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roastId: roastId,
        bypassCache: bypassCache,
        llm: selectedLLM
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to optimize resume')
    }

    const optimizedData = result.data
    
    // Update state to reflect new optimized resume exists
    setHasOptimizedResume(true)
    console.log('Optimization completed and saved to database')
    
    // Proceed with the optimized data
    proceedWithOptimizedData(optimizedData, result)
  }

  // Helper function to proceed with optimized data
  const proceedWithOptimizedData = (optimizedData: any, result: any) => {
    console.log('Optimized data ready:', optimizedData)
    
    // Store the optimized data in session storage with analysis context
    sessionStorage.setItem('optimizedResumeData', JSON.stringify(optimizedData))
    sessionStorage.setItem('optimizedDataTimestamp', Date.now().toString())
    sessionStorage.setItem('isFromAnalysis', 'true')
    sessionStorage.setItem('roastId', roastId || '')
    if (jobDescription) {
      sessionStorage.setItem('analysisJobDescription', jobDescription)
    }
    
    // Redirect to Resume Optimizer with prefilled parameter
    router.push('/resume-optimizer?prefilled=true')
  }

  // Handle PDF image modal
  const handleOpenImageModal = () => {
    if (pdfImages.length > 0) {
      setCurrentImageIndex(0)
      setShowImageModal(true)
    }
  }

  const handleCloseImageModal = () => {
    setShowImageModal(false)
    setCurrentImageIndex(0)
  }

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : pdfImages.length - 1)
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev < pdfImages.length - 1 ? prev + 1 : 0)
  }

  const handleCoverLetterGenerated = (cached: boolean, usageCount: number) => {
    if (cached) {
      setHasCoverLetter(true)
    } else {
      // If a new cover letter was generated, it means there's now a cached version
      setHasCoverLetter(false)
    }
  }

  const handleInterviewPrepGenerated = (cached: boolean) => {
    // Update the interview prep status when it's generated
    setHasInterviewPrep(true)
  }

  useEffect(() => {
    // Load analysis results from sessionStorage
    const storedAnalysis = sessionStorage.getItem('analysisResults')
    const storedResumeData = sessionStorage.getItem('resumeData')
    const storedJobDescription = sessionStorage.getItem('jobDescription')
    const storedRoastId = sessionStorage.getItem('roastId')
    const storedPdfImages = sessionStorage.getItem('pdfImages')
    const storedDocumentId = sessionStorage.getItem('documentId')
    const storedExtractedResumeId = sessionStorage.getItem('extractedResumeId')
    const isFromDashboard = sessionStorage.getItem('isFromDashboard') === 'true'
    const dashboardRoastId = sessionStorage.getItem('dashboardRoastId')
    
    console.log('=== ANALYSIS PAGE LOAD DEBUG ===')
    console.log('Stored analysis:', !!storedAnalysis)
    console.log('Stored resume data:', !!storedResumeData)
    console.log('Stored job description:', !!storedJobDescription)
    console.log('Stored roast ID:', storedRoastId)
    console.log('Stored document ID:', storedDocumentId)
    console.log('Stored extracted resume ID:', storedExtractedResumeId)
    console.log('Stored PDF images:', !!storedPdfImages)
    console.log('Is from dashboard:', isFromDashboard)
    console.log('Dashboard roast ID:', dashboardRoastId)
    
    // Load resume data first
    if (storedResumeData) {
      try {
        const parsedResumeData = JSON.parse(storedResumeData)
        // Ensure documentId is included in resumeData
        if (storedDocumentId && !parsedResumeData.documentId) {
          parsedResumeData.documentId = storedDocumentId
        }
        // Ensure extractedResumeId is included in resumeData
        if (storedExtractedResumeId && !parsedResumeData.extractedResumeId) {
          parsedResumeData.extractedResumeId = storedExtractedResumeId
        }
        setResumeData(parsedResumeData)
        console.log('✅ Resume data loaded successfully')
      } catch (error) {
        console.error('❌ Failed to parse resume data:', error)
      }
    }
    
    // Load job description
    if (storedJobDescription) {
      setJobDescription(storedJobDescription)
      console.log('✅ Job description loaded successfully:', storedJobDescription.length, 'characters')
    } else {
      // Fallback: check if job description is stored in analysis data
      if (storedAnalysis) {
        try {
          const analysis = JSON.parse(storedAnalysis)
          if (analysis.jobDescription) {
            setJobDescription(analysis.jobDescription)
            console.log('✅ Job description loaded from analysis data:', analysis.jobDescription.length, 'characters')
          }
        } catch (error) {
          console.error('❌ Failed to parse analysis for job description fallback:', error)
        }
      }
    }

    // Load roast ID - prioritize dashboard roast ID if available
    let finalRoastId = null
    if (dashboardRoastId) {
      finalRoastId = dashboardRoastId
      setRoastId(dashboardRoastId)
      console.log('✅ Using dashboard roast ID:', dashboardRoastId)
    } else if (storedRoastId) {
      finalRoastId = storedRoastId
      setRoastId(storedRoastId)
      console.log('✅ Using stored roast ID:', storedRoastId)
    } else {
      console.warn('⚠️ No roast ID found in sessionStorage')
      console.log('🔍 All sessionStorage keys:', Object.keys(sessionStorage))
      console.log('🔍 SessionStorage contents:')
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          const value = sessionStorage.getItem(key)
          console.log(`  ${key}: ${value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : 'null'}`)
        }
      }
    }
    
    // Load extracted resume ID
    if (storedExtractedResumeId) {
      // Store extracted resume ID for future use
      sessionStorage.setItem('extractedResumeId', storedExtractedResumeId)
    }
    
    // Load PDF images
    if (storedPdfImages) {
      try {
        const parsedImages = JSON.parse(storedPdfImages)
        setPdfImages(parsedImages)
        console.log('✅ PDF images loaded successfully:', parsedImages.length, 'images')
      } catch (error) {
        console.error('❌ Failed to parse PDF images:', error)
      }
    }
    
    // Load document ID
    if (storedDocumentId) {
      setDocumentId(storedDocumentId)
    }
    
    // Load analysis data
    if (storedAnalysis) {
      try {
        const analysis = JSON.parse(storedAnalysis)
        setAnalysisData(analysis)
        console.log('✅ Analysis data loaded successfully')
      } catch (error) {
        console.error('❌ Failed to parse analysis results:', error)
        // Only fall back to mock data if we don't have real data from dashboard
        if (!isFromDashboard) {
          console.log('📝 Using mock data as fallback')
          setAnalysisData(getMockData())
          // Only set mock resume data if we don't have real resume data
          if (!storedResumeData) {
            setResumeData(getMockResumeData())
          }
        }
      }
    } else {
      // Only use mock data if we're not coming from dashboard and have no real data
      if (!isFromDashboard) {
        console.log('📝 No stored analysis found, using mock data')
        setAnalysisData(getMockData())
        // Only set mock resume data if we don't have real resume data
        if (!storedResumeData) {
          setResumeData(getMockResumeData())
        }
      } else {
        console.log('⚠️ Coming from dashboard but no analysis data found - this might be an issue')
        // Still set mock data but preserve real resume/job data
        setAnalysisData(getMockData())
      }
    }
    
    // Clean up dashboard flags after loading
    if (isFromDashboard) {
      sessionStorage.removeItem('isFromDashboard')
      sessionStorage.removeItem('dashboardRoastId')
      console.log('🧹 Cleaned up dashboard navigation flags')
    }
    
    setIsLoading(false)
    console.log('=== ANALYSIS PAGE LOAD COMPLETE ===')
    console.log('📊 Final state summary:')
    console.log('  - Roast ID:', finalRoastId)
    console.log('  - PDF images:', pdfImages.length)
    console.log('  - Job description:', !!jobDescription)
    console.log('  - Analysis data:', !!analysisData)
    console.log('  - Resume data:', !!resumeData)
  }, [])

  // Debug effect to log state changes
  useEffect(() => {
    console.log('=== STATE UPDATE DEBUG ===')
    console.log('PDF images count:', pdfImages.length)
    console.log('Job description length:', jobDescription?.length || 0)
    console.log('Analysis data exists:', !!analysisData)
    console.log('Resume data exists:', !!resumeData)
    console.log('Roast ID:', roastId)
    if (pdfImages.length > 0) {
      console.log('First PDF image preview:', pdfImages[0].substring(0, 50) + '...')
    }
    if (jobDescription) {
      console.log('Job description preview:', jobDescription.substring(0, 100) + '...')
    }
  }, [pdfImages, jobDescription, analysisData, resumeData, roastId])

  const getMockResumeData = () => ({
    text: `John Doe
Software Engineer
john.doe@email.com | (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years developing web applications. Skilled in JavaScript, React, and Node.js. Looking for senior developer opportunities.

EXPERIENCE
Software Engineer | TechCorp Inc. | San Francisco, CA | 2020 - Present
• Developed web applications using React and Node.js
• Worked with team of 5 developers
• Fixed bugs and implemented new features
• Used Git for version control

Junior Developer | StartupXYZ | San Francisco, CA | 2019 - 2020
• Built websites using HTML, CSS, and JavaScript
• Learned new technologies
• Participated in code reviews

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2019
GPA: 3.5

SKILLS
JavaScript, React, Node.js, HTML, CSS, Git, MongoDB, Express.js`,
    extractedText: `John Doe - Software Engineer with 5+ years experience in web development using JavaScript, React, and Node.js. Currently at TechCorp Inc. developing applications and working with development teams.`,
    fileName: 'demo-resume.pdf'
  })

  const getMockData = (): AnalysisData => ({
    overallScore: 67,
    scoreLabel: "Needs Improvement",
    scoringBreakdown: {
      skills: 30,        // 30/40 = 75%
      experience: 22,    // 22/35 = 63%
      achievements: 9,   // 9/20 = 45%
      presentation: 4    // 4/5 = 80%
    },
    scoreJustification: "Your resume shows solid technical skills and professional presentation, but lacks quantified achievements and specific metrics that would make you stand out to hiring managers. The experience section needs more impact-driven content.",
    strengths: [
      "Strong technical skills section with relevant technologies",
      "Clear employment history with specific dates",
      "Good use of action verbs in bullet points",
      "Professional email address and contact information"
    ],
    weaknesses: [
      "Missing quantifiable achievements and metrics",
      "Generic summary that doesn't stand out",
      "No keywords matching the target job posting",
      "Inconsistent formatting in bullet points",
      "Missing industry-specific certifications"
    ],
    suggestions: [
      {
        section: "Summary",
        issue: "Generic and forgettable summary statement",
        solution: "Craft a compelling summary that highlights your unique value proposition with specific achievements",
        priority: "high"
      },
      {
        section: "Experience", 
        issue: "Bullet points lack impact and metrics",
        solution: "Transform weak bullet points into achievement-focused statements with quantifiable results",
        priority: "high"
      },
      {
        section: "Skills",
        issue: "Missing key technologies from job posting",
        solution: "Add React, TypeScript, and AWS to match job requirements",
        priority: "medium"
      },
      {
        section: "Format",
        issue: "ATS compatibility issues detected",
        solution: "Simplify formatting and use standard section headers for better parsing",
        priority: "low"
      }
    ],
    keywordMatch: {
      matched: ["JavaScript", "Node.js", "API", "Database", "Git"],
      missing: ["React", "TypeScript", "AWS", "Docker", "Kubernetes", "CI/CD"],
      matchPercentage: 45
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600" 
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Strong Resume"
    if (score >= 60) return "Needs Improvement"
    return "Needs Major Work"
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium": return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <AlertTriangle className="h-4 w-4 text-blue-500" />
    }
  }

  // Helper function to safely calculate presentation percentage
  const getPresentationPercentage = (presentationScore: number) => {
    // Ensure the score is within valid range (0-5)
    const validScore = Math.max(0, Math.min(5, Number(presentationScore) || 0))
    return Math.round((validScore / 5) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (isGeneratingOptimized) {
    return <ResumeOptimizationLoading />
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No analysis data available.</p>
          <Link href="/">
            <Button>Upload Resume</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation currentPage="analysis" />

      <div className="container mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 text-gray-600 hover:text-orange-500 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Upload</span>
          </Link>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => shareAnalysis(analysisData, undefined, resumeData, jobDescription, pdfImages, roastId)}
              disabled={isSharing || !analysisData}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {isSharing ? 'Creating Link...' : 'Share Results'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => downloadReport(analysisData, resumeData, jobDescription)}
              disabled={isDownloading || !analysisData}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Generating...' : 'Download Report'}
            </Button>
          </div>
        </div>

        {/* Score Overview */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Resume Roast Complete! 🔥</h1>
                  <p className="text-lg opacity-90">Here's your brutally honest feedback</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold mb-2">{analysisData.overallScore}%</div>
                  <div className="text-lg">{analysisData.scoreLabel || getScoreLabel(analysisData.overallScore)}</div>
                </div>
              </div>
              <div className="mt-6">
                <Progress value={analysisData.overallScore} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resume and Job Description Overview */}
        <div className="mb-8 grid md:grid-cols-2 gap-6">
          {/* Original Resume Section */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Image className="h-6 w-6 text-blue-600" />
                <span className="text-blue-800">Your Resume</span>
              </CardTitle>
              <CardDescription>
                The resume we analyzed for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pdfImages.length > 0 ? (
                <div className="space-y-4">
                  {/* Resume Preview Thumbnail */}
                  <div className="relative bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                    <div className="flex justify-center">
                      <img
                        src={`data:image/png;base64,${pdfImages[0]}`}
                        alt="Resume Preview"
                        className="max-w-full max-h-48 object-contain rounded shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={handleOpenImageModal}
                      />
                    </div>
                    {pdfImages.length > 1 && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {pdfImages.length} pages
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleOpenImageModal}
                    className="w-full text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    View Full Resume ({pdfImages.length} page{pdfImages.length > 1 ? 's' : ''})
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-blue-100 rounded-lg w-fit mx-auto mb-4">
                    <FileText className="h-12 w-12 text-blue-600" />
                  </div>
                  <p className="text-gray-600 mb-2">Resume content analyzed</p>
                  <p className="text-sm text-gray-500">
                    {resumeData?.fileName || 'Text-based resume processed'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Description Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="h-6 w-6 text-purple-600" />
                <span className="text-purple-800">Target Job</span>
              </CardTitle>
              <CardDescription>
                The position you're applying for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobDescription ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm max-h-48 overflow-y-auto">
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {jobDescription.length > 500 
                        ? `${jobDescription.substring(0, 500)}...` 
                        : jobDescription
                      }
                    </div>
                  </div>
                  
                  {jobDescription.length > 500 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Create a modal or expand to show full job description
                        const modal = document.createElement('div')
                        modal.innerHTML = `
                          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div class="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto p-6">
                              <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-semibold">Full Job Description</h3>
                                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </button>
                              </div>
                              <div class="prose max-w-none whitespace-pre-wrap">${jobDescription}</div>
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
              ) : (
                <div className="text-center py-8">
                  <div className="p-4 bg-purple-100 rounded-lg w-fit mx-auto mb-4">
                    <Briefcase className="h-12 w-12 text-purple-600" />
                  </div>
                  <p className="text-gray-600 mb-2">No specific job targeted</p>
                  <p className="text-sm text-gray-500">
                    General resume analysis performed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scoring Breakdown */}
        {analysisData.scoringBreakdown && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Score Breakdown</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-cyan-100 to-teal-200 border-cyan-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="p-3 bg-cyan-500/20 rounded-lg w-fit mx-auto mb-3">
                      <Zap className="h-8 w-8 text-cyan-600" />
                    </div>
                    <p className="text-sm font-medium text-cyan-700 mb-2">Skills</p>
                    <div className="relative">
                      <div className="text-3xl font-bold text-cyan-800 mb-2">{Math.round((analysisData.scoringBreakdown.skills / 40) * 100)}%</div>
                      <Progress value={Math.round((analysisData.scoringBreakdown.skills / 40) * 100)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-100 to-purple-200 border-indigo-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="p-3 bg-indigo-500/20 rounded-lg w-fit mx-auto mb-3">
                      <CheckCircle className="h-8 w-8 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-indigo-700 mb-2">Experience</p>
                    <div className="relative">
                      <div className="text-3xl font-bold text-indigo-800 mb-2">{Math.round((analysisData.scoringBreakdown.experience / 35) * 100)}%</div>
                      <Progress value={Math.round((analysisData.scoringBreakdown.experience / 35) * 100)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-100 to-orange-200 border-yellow-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="p-3 bg-yellow-500/20 rounded-lg w-fit mx-auto mb-3">
                      <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium text-yellow-700 mb-2">Achievements</p>
                    <div className="relative">
                      <div className="text-3xl font-bold text-yellow-800 mb-2">{Math.round((analysisData.scoringBreakdown.achievements / 20) * 100)}%</div>
                      <Progress value={Math.round((analysisData.scoringBreakdown.achievements / 20) * 100)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-100 to-rose-200 border-pink-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="p-3 bg-pink-500/20 rounded-lg w-fit mx-auto mb-3">
                      <XCircle className="h-8 w-8 text-pink-600" />
                    </div>
                    <p className="text-sm font-medium text-pink-700 mb-2">Presentation</p>
                    <div className="relative">
                      <div className="text-3xl font-bold text-pink-800 mb-2">{getPresentationPercentage(analysisData.scoringBreakdown.presentation)}%</div>
                      <Progress value={getPresentationPercentage(analysisData.scoringBreakdown.presentation)} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <span>What's Working</span>
                </CardTitle>
                <CardDescription>
                  These are the strong points we found in your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 prose prose-sm max-w-none text-gray-700 [&>p]:mb-0 [&>p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {strength}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <span>The Brutal Truth</span>
                </CardTitle>
                <CardDescription>
                  Areas that need immediate attention (this is where the roasting happens)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 prose prose-sm max-w-none text-gray-700 [&>p]:mb-0 [&>p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {weakness}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Improvement Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  <span>How to Fix It</span>
                </CardTitle>
                <CardDescription>
                  Specific, actionable suggestions to transform your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{suggestion.section}</h4>
                        <div className="flex items-center space-x-1">
                          {getPriorityIcon(suggestion.priority)}
                          <span className="text-sm capitalize text-gray-600">{suggestion.priority} Priority</span>
                        </div>
                      </div>
                      <div className="text-red-600 text-sm mb-2">
                        <strong>Issue:</strong>
                        <div className="prose prose-sm max-w-none mt-1 [&>p]:mb-0 [&>p]:leading-relaxed [&_strong]:font-semibold">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {suggestion.issue}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <div className="text-green-600 text-sm">
                        <strong>Solution:</strong>
                        <div className="prose prose-sm max-w-none mt-1 [&>p]:mb-0 [&>p]:leading-relaxed [&_strong]:font-semibold">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {suggestion.solution}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score Justification */}
            {analysisData.scoreJustification && (
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="text-orange-700">Score Explanation</span>
                  </CardTitle>
                  <CardDescription>
                    Why your resume received this score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {analysisData.scoreJustification}
                      </ReactMarkdown>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keyword Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Keyword Match</CardTitle>
                <CardDescription>
                  How well your resume matches the job posting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Keyword Match Percentage */}
                {analysisData.keywordMatch.matchPercentage !== undefined && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Match Rate</span>
                      <span className={`text-2xl font-bold ${
                        analysisData.keywordMatch.matchPercentage >= 70 
                          ? 'text-green-600' 
                          : analysisData.keywordMatch.matchPercentage >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}>
                        {analysisData.keywordMatch.matchPercentage}%
                      </span>
                    </div>
                    <Progress 
                      value={analysisData.keywordMatch.matchPercentage} 
                      className={`h-2 ${
                        analysisData.keywordMatch.matchPercentage >= 70 
                          ? '[&>*]:bg-green-600' 
                          : analysisData.keywordMatch.matchPercentage >= 50
                            ? '[&>*]:bg-yellow-600'
                            : '[&>*]:bg-red-600'
                      }`}
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      {analysisData.keywordMatch.matchPercentage >= 70 
                        ? 'Excellent keyword optimization!' 
                        : analysisData.keywordMatch.matchPercentage >= 50
                          ? 'Good match, but room for improvement'
                          : 'Needs significant keyword optimization'
                      }
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Matched Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.keywordMatch.matched.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.keywordMatch.missing.map((keyword, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ATS Issues */}
            {analysisData.atsIssues && analysisData.atsIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>ATS Compatibility</CardTitle>
                  <CardDescription>
                    Issues that might prevent ATS systems from parsing your resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisData.atsIssues.map((issue, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 prose prose-sm max-w-none text-gray-700 [&>p]:mb-0 [&>p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-gray-900">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {issue}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Next steps to improve your resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Consolidated Cache & System Status */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setIsDebugExpanded(!isDebugExpanded)}
                      className="w-full px-3 py-2 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4" />
                        <span>Cache Status</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            hasOptimizedResume && hasCoverLetter && hasInterviewPrep ? 'bg-green-500' : 
                            hasOptimizedResume || hasCoverLetter || hasInterviewPrep ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-xs text-gray-600">
                            {hasOptimizedResume && hasCoverLetter && hasInterviewPrep ? 'Fully Available' :
                             hasOptimizedResume || hasCoverLetter || hasInterviewPrep ? 'Partially Available' : 'Not Generated'}
                          </span>
                        </div>
                      </div>
                      {isDebugExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {isDebugExpanded && (
                      <div className="px-3 py-3 border-t border-gray-100 bg-gray-50/50">
                        <div className="space-y-3">
                          {/* Data Status Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Analysis</span>
                              <span className={`font-medium ${analysisData ? 'text-green-600' : 'text-red-600'}`}>
                                {analysisData ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Resume</span>
                              <span className={`font-medium ${resumeData ? 'text-green-600' : 'text-red-600'}`}>
                                {resumeData ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Job Desc</span>
                              <span className={`font-medium ${jobDescription ? 'text-green-600' : 'text-gray-400'}`}>
                                {jobDescription ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Optimized Resume</span>
                              <span className={`font-medium ${hasOptimizedResume ? 'text-blue-600' : 'text-gray-400'}`}>
                                {hasOptimizedResume ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Cover Letter</span>
                              <span className={`font-medium ${hasCoverLetter ? 'text-purple-600' : 'text-gray-400'}`}>
                                {hasCoverLetter ? '✓' : '✗'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Interview Prep</span>
                              <span className={`font-medium ${hasInterviewPrep ? 'text-blue-600' : 'text-gray-400'}`}>
                                {hasInterviewPrep ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>
                          
                          
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium" 
                    size="sm" 
                    onClick={() => handleGenerateOptimized()}
                    disabled={isGeneratingOptimized}
                  >
                    {isGeneratingOptimized ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : hasOptimizedResume ? (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Optimized Version (Fast)
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Optimized Version
                      </>
                    )}
                  </Button>
                  
                  {/* Force Regenerate Button - only show if we have existing data */}
                  {/* {hasOptimizedResume && (
                    <Button 
                      variant="outline"
                      className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700" 
                      size="sm" 
                      onClick={() => {
                        showAlert({
                          title: "Force Regenerate",
                          description: "This will bypass existing data and generate a completely fresh optimized version using AI. This may take longer but ensures the latest optimization techniques are applied.",
                          type: "info",
                          confirmText: "Force Regenerate",
                          cancelText: "Cancel",
                          showCancel: true,
                          onConfirm: () => handleGenerateOptimized(true)
                        })
                      }}
                      disabled={isGeneratingOptimized}
                    >
                      {isGeneratingOptimized ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                          Force Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Force Regenerate (Bypass Database)
                        </>
                      )}
                    </Button>
                  )} */}
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => setShowCoverLetterModal(true)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Get Cover Letter
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full opacity-60 cursor-not-allowed" 
                    size="sm"
                    disabled
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn Optimization (Coming Soon)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => setShowInterviewPrepModal(true)}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Interview Prep
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Prompt */}
            {(!subscription || subscription.tier === 'FREE' || subscription.tier === 'PLUS') && (
              <Card className="bg-gradient-to-b from-orange-50 to-red-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-700">
                    {!subscription || subscription.tier === 'FREE' 
                      ? 'Unlock Premium Features' 
                      : 'Upgrade to Premium'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    {!subscription || subscription.tier === 'FREE' ? (
                      <>
                        <li>• Unlimited resume roasts</li>
                        <li>• AI-powered rewriting</li>
                        <li>• ATS optimization</li>
                        <li>• Cover letter generation</li>
                        <li>• LinkedIn optimization</li>
                        <li>• Interview prep</li>
                      </>
                    ) : (
                      <>
                        <li>• Bulk processing</li>
                        <li>• Advanced analytics</li>
                        <li>• Dedicated account manager</li>
                      </>
                    )}
                  </ul>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push('/pricing')}
                  >
                    {!subscription || subscription.tier === 'FREE' 
                      ? 'Upgrade to Plus' 
                      : 'Upgrade to Premium'
                    }
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Alert Dialog */}
      {AlertDialog}

      {/* Cover Letter Modal */}
      <CoverLetterModal
        isOpen={showCoverLetterModal}
        onClose={() => setShowCoverLetterModal(false)}
        resumeData={resumeData}
        jobDescription={jobDescription}
        analysisData={analysisData}
        roastId={roastId}
        onCoverLetterGenerated={handleCoverLetterGenerated}
      />

      {/* Resume Optimization Modal */}
      <ResumeOptimizationModal
        isOpen={showResumeOptimizationModal}
        onClose={() => setShowResumeOptimizationModal(false)}
        onConfirm={handleOptimizationConfirm}
        isGenerating={isGeneratingOptimized}
      />

      {/* Interview Prep Modal */}
      <InterviewPrepModal
        isOpen={showInterviewPrepModal}
        onClose={() => setShowInterviewPrepModal(false)}
        resumeData={resumeData}
        jobDescription={jobDescription}
        analysisData={analysisData}
        roastId={roastId}
        onInterviewPrepGenerated={handleInterviewPrepGenerated}
      />

      {/* PDF Images Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Image className="h-5 w-5" />
                <span>Resume Preview - Page {currentImageIndex + 1} of {pdfImages.length}</span>
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-1 p-6 pt-2">
            {pdfImages.length > 0 && (
              <div className="relative">
                {/* Main Image */}
                <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4 min-h-[400px]">
                  <img
                    src={`data:image/png;base64,${pdfImages[currentImageIndex]}`}
                    alt={`Resume Page ${currentImageIndex + 1}`}
                    className="max-w-full max-h-[60vh] object-contain shadow-lg rounded"
                  />
                </div>
                
                {/* Navigation Arrows */}
                {pdfImages.length > 1 && (
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
                {pdfImages.length > 1 && (
                  <div className="flex justify-center mt-4 space-x-2">
                    {pdfImages.map((_, index) => (
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

      <Footer />
    </div>
  )
} 