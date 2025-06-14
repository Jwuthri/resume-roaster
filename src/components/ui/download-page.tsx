"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "./card"
import { Button } from "./button"
import { useAlertDialog } from "./alert-dialog"
import { 
  Download, 
  CheckCircle, 
  Edit3,
  Sparkles,
  ArrowLeft,
  FileText
} from "lucide-react"
import { ResumeData } from "@/lib/resume-templates"
import { generatePDF, generateDOCX, downloadBlob } from "@/lib/document-generators"
import { useUserProfile } from "@/hooks/useUserProfile"

interface OptimizedResumeResponse {
  resume: string
  format: 'html' | 'markdown'
  template: {
    id: string
    name: string
    description: string
    category: 'modern' | 'classic' | 'tech' | 'creative' | 'executive'
    atsOptimized: boolean
  }
  optimizations: {
    suggestions: string[]
    keywordsFound: string[]
    atsScore: number
  }
}

export default function DownloadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showAlert } = useAlertDialog()
  const { profile, updateProfile } = useUserProfile()
  
  const [optimizedResult, setOptimizedResult] = useState<OptimizedResumeResponse | null>(null)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadOptimizedResume = async () => {
      try {
        // First try to load from database
        let apiUrl = '/api/optimized-resume'
        if (profile?.currentRoastId) {
          apiUrl += `?roastId=${profile.currentRoastId}`
        }
        
        const response = await fetch(apiUrl)
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            console.log('Loaded optimized resume from API:', result.data)
            
            // Transform database result to match expected format
            const transformedResult: OptimizedResumeResponse = {
              resume: result.data.content,
              format: 'html' as const,
              template: {
                id: result.data.templateId,
                name: 'Resume Template',
                description: 'Generated resume template',
                category: 'modern' as const,
                atsOptimized: false
              },
              optimizations: {
                suggestions: [],
                keywordsFound: result.data.keywordsMatched || [],
                atsScore: result.data.atsScore || 0
              }
            }
            setOptimizedResult(transformedResult)
            
            // Ensure the structured resume data is properly formatted
            let structuredData = result.data.data
            if (structuredData && typeof structuredData === 'object') {
              // Ensure all required fields exist with proper defaults
              const processedData: ResumeData = {
                personalInfo: {
                  name: structuredData.personalInfo?.name || '',
                  email: structuredData.personalInfo?.email || '',
                  phone: structuredData.personalInfo?.phone || '',
                  location: structuredData.personalInfo?.location || '',
                  linkedin: structuredData.personalInfo?.linkedin || '',
                  portfolio: structuredData.personalInfo?.portfolio || '',
                  github: structuredData.personalInfo?.github || '',
                  jobTitle: structuredData.personalInfo?.jobTitle || '',
                  jobDescription: structuredData.personalInfo?.jobDescription || ''
                },
                summary: structuredData.summary || '',
                experience: structuredData.experience || [],
                education: structuredData.education || [],
                skills: {
                  technical: structuredData.skills?.technical || [],
                  soft: structuredData.skills?.soft || [],
                  languages: structuredData.skills?.languages || [],
                  certifications: structuredData.skills?.certifications || []
                },
                projects: structuredData.projects || [],
                publications: structuredData.publications || [],
                training: structuredData.training || []
              }
              console.log('Processed resume data for editing:', processedData)
              setResumeData(processedData)
            } else {
              console.warn('No structured resume data found in API response')
              setResumeData(null)
            }
            
            setIsLoading(false)
            return
          }
        }

        // Fallback: try to load from sessionStorage (for backward compatibility)
        const storedResult = sessionStorage.getItem('optimizedResumeResult')
        const storedResumeData = sessionStorage.getItem('resumeDataForDownload')
        
        if (storedResult && storedResumeData) {
          setOptimizedResult(JSON.parse(storedResult))
          setResumeData(JSON.parse(storedResumeData))
          setIsLoading(false)
          return
        }
        
        // If no optimized resume found, try to load resume data from profile
        if (profile?.resumeData) {
          setResumeData(profile.resumeData)
          showAlert({
            title: "No Optimized Resume Found",
            description: "Please generate your resume first.",
            type: "warning",
            confirmText: "Go to Resume Optimizer",
            onConfirm: () => router.push('/resume-optimizer')
          })
        } else {
          // If no data found anywhere, redirect back to resume optimizer
          showAlert({
            title: "No Resume Data Found",
            description: "Please generate your resume first.",
            type: "warning",
            confirmText: "Go to Resume Optimizer",
            onConfirm: () => router.push('/resume-optimizer')
          })
        }
      } catch (error) {
        console.error('Error loading resume data:', error)
        showAlert({
          title: "Error Loading Resume",
          description: "There was an error loading your resume data.",
          type: "error",
          confirmText: "Go to Resume Optimizer",
          onConfirm: () => router.push('/resume-optimizer')
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOptimizedResume()
  }, [router, showAlert, profile])

  const handleDownloadPDF = async () => {
    if (!optimizedResult) return
    
    try {
      // If we don't have proper resume data, try to generate PDF from HTML content
      if (!resumeData || !resumeData.personalInfo || !resumeData.personalInfo.name || resumeData.personalInfo.name === 'Your Name') {
        // Use the HTML content directly for PDF generation
        const response = await fetch('/api/generate-pdf-from-html', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            htmlContent: optimizedResult.resume,
            fileName: 'optimized-resume'
          }),
        })

        if (response.ok) {
          const blob = await response.blob()
          downloadBlob(blob, 'optimized-resume.pdf')
        } else {
          throw new Error('Failed to generate PDF from HTML')
        }
      } else {
        // Use the standard PDF generation with resume data
        const blob = await generatePDF(resumeData, optimizedResult.resume)
        downloadBlob(blob, `${resumeData.personalInfo.name}_Resume.pdf`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      showAlert({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        type: "error",
        confirmText: "OK"
      })
    }
  }

  const handleDownloadDOCX = async () => {
    if (!optimizedResult) return
    
    try {
      // DOCX generation requires proper resume data structure
      if (!resumeData || !resumeData.personalInfo || !resumeData.personalInfo.name || resumeData.personalInfo.name === 'Your Name') {
        showAlert({
          title: "DOCX Generation Not Available",
          description: "DOCX download requires complete resume data. Please use PDF download instead.",
          type: "warning",
          confirmText: "OK"
        })
        return
      }
      
      const blob = await generateDOCX(resumeData)
      downloadBlob(blob, `${resumeData.personalInfo.name}_Resume.docx`)
    } catch (error) {
      console.error('Error generating DOCX:', error)
      showAlert({
        title: "DOCX Generation Failed", 
        description: "Failed to generate DOCX. Please try again.",
        type: "error",
        confirmText: "OK"
      })
    }
  }

  const handleEditResume = async () => {
    try {
      // Clear the optimized result from sessionStorage
      sessionStorage.removeItem('optimizedResumeResult')
      
      // Ensure we have resume data to save
      let dataToSave = resumeData
      
      // If we don't have structured resume data but have an optimized result,
      // we need to extract what we can or show a warning
      if (!dataToSave || !dataToSave.personalInfo || !dataToSave.personalInfo.name || dataToSave.personalInfo.name === 'Your Name') {
        // Try to load from the current profile as fallback
        if (profile?.resumeData && profile.resumeData.personalInfo?.name && profile.resumeData.personalInfo.name !== 'Your Name') {
          dataToSave = profile.resumeData
        } else {
          // Show warning that editing may be limited
          showAlert({
            title: "Limited Editing Available",
            description: "Your resume will be available for editing, but some data may need to be re-entered. The generated content will be preserved.",
            type: "warning",
                         confirmText: "Continue to Editor",
             onConfirm: () => {
               router.push('/resume-optimizer?reload=true')
             }
          })
          return
        }
      }
      
      // Save the resume data to the database profile
      if (dataToSave && updateProfile) {
        console.log('Saving resume data for editing:', dataToSave)
        await updateProfile({
          resumeData: dataToSave,
          lastPage: '/resume-optimizer'
        })
        
                 // Add a small delay to ensure the data is saved before navigation
         setTimeout(() => {
           router.push('/resume-optimizer?reload=true')
         }, 500)
               } else {
           router.push('/resume-optimizer?reload=true')
         }
    } catch (error) {
      console.error('Error saving resume data for editing:', error)
      showAlert({
        title: "Error Saving Data",
        description: "There was an error saving your resume data. You can still edit, but some information may need to be re-entered.",
        type: "error",
                 confirmText: "Continue Anyway",
         onConfirm: () => router.push('/resume-optimizer?reload=true')
      })
    }
  }

  const handleBackToOptimizer = () => {
    router.push('/resume-optimizer')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    )
  }

  if (!optimizedResult) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Resume Found</h2>
        <p className="text-gray-600 mb-6">Please generate your resume first.</p>
        <Button onClick={handleBackToOptimizer} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go to Resume Optimizer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-6 shadow-lg">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
          Resume Ready for Download!
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your resume has been optimized for the target job with an ATS Score of {optimizedResult.optimizations.atsScore}%
        </p>
      </div>

      {/* Download Actions */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Show notice if we have limited resume data */}
          {(!resumeData || !resumeData.personalInfo || !resumeData.personalInfo.name || resumeData.personalInfo.name === 'Your Name') && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Limited download options available. PDF download will work, but DOCX requires complete resume data.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <Button 
              onClick={handleDownloadPDF} 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </Button>
            <Button 
              onClick={handleDownloadDOCX} 
              variant="outline" 
              className="border-orange-300 text-orange-600 hover:bg-orange-50 shadow-lg"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download DOCX
            </Button>
            <Button 
              onClick={handleEditResume} 
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50 shadow-lg"
              size="lg"
            >
              <Edit3 className="h-5 w-5 mr-2" />
              Edit Resume
            </Button>
            <Button 
              onClick={handleBackToOptimizer} 
              variant="ghost"
              className="text-gray-600 hover:bg-gray-50"
              size="lg"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Optimizer
            </Button>
          </div>

          {/* Optimization suggestions */}
          {optimizedResult.optimizations.suggestions.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
              <h3 className="font-semibold mb-4 text-amber-800 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Optimization Suggestions
              </h3>
              <ul className="space-y-3">
                {optimizedResult.optimizations.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-yellow-800">{index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resume preview */}
          <div className="border rounded-xl p-8 bg-white shadow-inner">
            <div className="bg-white rounded-lg shadow-inner border overflow-hidden" style={{ minHeight: '600px' }}>
              <iframe
                srcDoc={optimizedResult.resume}
                className="w-full border-0"
                style={{ 
                  height: '800px',
                  width: '100%'
                }}
                sandbox="allow-same-origin"
                title="Optimized Resume"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 