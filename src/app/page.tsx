"use client"

import { useState } from "react"
import { Flame, Zap, Target, FileCheck, ArrowRight, Upload, Loader, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/ui/file-upload"
import { RoastLimitBanner } from "@/components/ui/roast-limit-banner"
import { ExtractedTextPreview } from "@/components/ui/extracted-text-preview"
import { AnalysisLoading } from "@/components/ui/analysis-loading"
import { Navigation } from "@/components/ui/navigation"
import { useAlertDialog } from "@/components/ui/alert-dialog"
import { ExtractionMethodSelector } from "@/components/ExtractionMethodSelector"
import { ResumeAnalysisModal } from "@/components/ui/resume-analysis-modal"
import { useRoastLimit } from "@/hooks/useRoastLimit"
import { useFileExtraction } from "@/hooks/useFileExtraction"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Footer } from "@/components/ui/footer"
import { PostHogTest } from "@/components/ui/posthog-test"

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [step, setStep] = useState<'upload' | 'method-select' | 'extracted' | 'analyzing'>('upload')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [selectedExtractionMethod, setSelectedExtractionMethod] = useState<'basic' | 'ai'>('ai')
  const [selectedProvider, setSelectedProvider] = useState<'anthropic' | 'openai'>('openai')
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [pendingAnalysisData, setPendingAnalysisData] = useState<{
    resumeData: any
    jobDescription: string
    analysisName?: string
  } | null>(null)
  const { data: session } = useSession()
  const { showAlert, AlertDialog } = useAlertDialog()
  const { updateProfile } = useUserProfile()
  
  const { 
    roastCount, 
    canRoast, 
    isLoading, 
    remainingRoasts, 
    maxRoasts, 
    tier,
    isAuthenticated,
    incrementRoastCount 
  } = useRoastLimit()
  
  const {
    isExtracting,
    extractedData,
    error: extractionError,
    images: pdfImages,
    documentId,
    fileHash,
    extractFile,
    clearExtraction,
    deleteDocument,
    retryExtraction,
    getFileTypeInfo,
    extractionMethod: currentExtractionMethod
  } = useFileExtraction()
  
  const router = useRouter()

  const features = [
    {
      icon: <Flame className="h-8 w-8 text-orange-500" />,
      title: "AI-Powered Analysis",
      description: "Get honest, no-holds-barred feedback powered by the most powerful AI."
    },
    {
      icon: <Target className="h-8 w-8 text-red-500" />,
      title: "Smart PDF Extraction",
      description: "Advanced AI extracts and formats your resume content with perfect accuracy."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "Instant Markdown Formatting",
      description: "Your resume is automatically formatted as clean, professional markdown."
    },
    {
      icon: <FileCheck className="h-8 w-8 text-green-500" />,
      title: "ATS-Friendly Format",
      description: "Ensure your resume passes through applicant tracking systems successfully."
    },
    {
      icon: <Eye className="h-8 w-8 text-purple-500" />,
      title: "Resume Optimizer",
      description: "Generate ATS-optimized resumes tailored to specific job descriptions with professional templates."
    }
  ]

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    
    // Check if it's a PDF file and user is registered
    const isPDF = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
    
    if (isPDF && isAuthenticated) {
      // Show method selection for registered users with PDF files
      setStep('method-select')
    } else {
      // For non-PDF files or non-registered users, extract immediately
      const extractionMethod = isPDF ? 'basic' : 'auto' // Non-registered users get basic for PDF
      const extracted = await extractFile(file, session?.user?.id, extractionMethod)
      if (extracted) {
        setStep('extracted')
      }
    }
  }

  const handleExtractionMethodSelect = async (method: 'basic' | 'ai', provider?: 'anthropic' | 'openai', model?: string) => {
    setSelectedExtractionMethod(method)
    if (provider) {
      setSelectedProvider(provider)
    }
    if (model) {
      setSelectedModel(model)
    }
    
    if (selectedFile) {
      const extractionProvider = method === 'ai' ? (provider || 'openai') : 'openai'
      const selectedModelForExtraction = method === 'ai' ? model : undefined
      const extracted = await extractFile(selectedFile, session?.user?.id, method, extractionProvider, selectedModelForExtraction)
      if (extracted) {
        setStep('extracted')
      }
    }
  }

  const handleFileRemove = async () => {
    // Only try to delete document from database if it exists and has been processed
    if (extractedData && (documentId || fileHash)) {
      try {
        await deleteDocument(session?.user?.id)
      } catch (error) {
        console.warn('Failed to delete document from database:', error)
        // Continue with cleanup even if database deletion fails
      }
    }
    
    // Always clear the extraction state
    clearExtraction()
    
    setSelectedFile(null)
    setStep('upload')
    setAnalysisProgress(0)
    setSelectedExtractionMethod('ai')
    setSelectedProvider('openai')
    setSelectedModel(undefined)
  }

  const handleRerun = async (method: 'basic' | 'ai', provider?: 'anthropic' | 'openai', model?: string) => {
    if (!selectedFile) {
      showAlert({
        title: "No File Selected",
        description: "Please upload a file first!",
        type: "warning"
      })
      return
    }

    try {
      // Update the selected method and provider
      setSelectedExtractionMethod(method)
      if (provider) {
        setSelectedProvider(provider)
      }
      if (model) {
        setSelectedModel(model)
      }

      // Re-run extraction with new settings and bypass cache to force fresh extraction
      const extracted = await retryExtraction(selectedFile, session?.user?.id, method, provider, model, true)
      if (extracted) {
        showAlert({
          title: "Re-extraction Complete",
          description: `Successfully re-extracted using ${method} method${provider ? ` with ${provider}` : ''} with fresh data`,
          type: "success"
        })
      }
    } catch (error) {
      console.error('Re-run extraction error:', error)
      showAlert({
        title: "Re-run Failed",
        description: error instanceof Error ? error.message : "Failed to re-run extraction",
        type: "error"
      })
    }
  }

  const handleStartRoasting = async (resumeData: any, jobDescription: string, analysisName?: string) => {
    if (!resumeData) {
      showAlert({
        title: "Resume Required",
        description: "Please upload a resume first!",
        type: "warning"
      })
      return
    }

    if (!canRoast) {
      showAlert({
        title: "Credit Limit Reached",
        description: "You've reached your free credit limit. Please upgrade to continue!",
        type: "warning",
        confirmText: "Upgrade Now",
        onConfirm: () => router.push('/pricing')
      })
      return
    }

    if (!jobDescription.trim()) {
      showAlert({
        title: "Job Description Required",
        description: "Please provide a job description!",
        type: "warning"
      })
      return
    }

    // Store the analysis data and show modal for model selection
    setPendingAnalysisData({ resumeData, jobDescription, analysisName })
    setShowAnalysisModal(true)
  }

  const handleAnalysisConfirm = async (selectedLLM: string) => {
    if (!pendingAnalysisData) return

    const { resumeData, jobDescription, analysisName } = pendingAnalysisData
    
    setShowAnalysisModal(false)
    setStep('analyzing')
    setAnalysisProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 5
      })
    }, 1000)

    try {
      // Step 1: Process job description first
      console.log('Processing job description...')
      const jobProcessResponse = await fetch('/api/summarize-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim()
        }),
      })

      const jobProcessResult = await jobProcessResponse.json()

      if (!jobProcessResponse.ok) {
        throw new Error(jobProcessResult.error || 'Failed to process job description')
      }

      console.log('Job description processed:', jobProcessResult)

      // Step 2: Create summarized resume record
      console.log('Creating summarized resume record...')
      const resumeText = typeof resumeData === 'string' ? resumeData : 
                        resumeData.text || resumeData.extractedText || JSON.stringify(resumeData)
      
      const summarizeResumeResponse = await fetch('/api/summarized_resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: resumeText,
          resumeId: resumeData.resumeId || resumeData.documentId,
          extractedResumeId: resumeData.extractedResumeId || resumeData.documentId,
          bypassCache: false
        }),
      })

      const summarizeResumeResult = await summarizeResumeResponse.json()

      if (!summarizeResumeResponse.ok) {
        console.warn('Failed to create summarized resume:', summarizeResumeResult.error)
        // Continue with analysis even if summarization fails
      } else {
        console.log('Summarized resume created:', summarizeResumeResult)
      }

      // Step 3: Call the analysis API with the selected model
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          jobDescription: jobDescription.trim(),
          extractedJobId: jobProcessResult.extractedJobId,
          summarizedResumeId: summarizeResumeResult?.summarizedResumeId || null,
          analysisName: analysisName?.trim(),
          selectedLLM // Pass the selected model
        }),
      })

      const result = await response.json()

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze resume')
      }

      // Complete the progress
      setAnalysisProgress(100)

      // Increment the roast count
      incrementRoastCount()
      
      // Store analysis results in database instead of sessionStorage
      try {
        if (updateProfile) {
          await updateProfile({
            currentRoastId: result.roastId,
            currentJobDescription: jobDescription,
            isFromAnalysis: true,
            lastPage: '/analysis'
          })
        }
      } catch (error) {
        console.error('Failed to save analysis data to profile:', error)
        // Continue with navigation even if profile save fails
      }
      
      // Small delay to show 100% completion
      setTimeout(() => {
        // Navigate to analysis page with roast ID as URL parameter
        router.push(`/analysis?roastId=${result.roastId}`)
      }, 500)
    } catch (error) {
      console.error('Analysis error:', error)
      showAlert({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Failed to analyze resume. Please try again.',
        type: "error"
      })
      
      // Reset to previous step on error
      setStep('extracted')
      setAnalysisProgress(0)
    } finally {
      setPendingAnalysisData(null)
    }
  }

  const handleUpgrade = () => {
    router.push("/pricing")
  }

  const handleRetryExtraction = async () => {
    if (selectedFile) {
      const method = step === 'method-select' ? selectedExtractionMethod : 'auto'
      await retryExtraction(selectedFile, session?.user?.id, method, selectedProvider, selectedModel)
    }
  }

  const handleBackToUpload = () => {
    setStep('upload')
    setSelectedFile(null)
    clearExtraction()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Flame className="h-12 w-12 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading Resume Roaster...</p>
        </div>
      </div>
    )
  }

  // Show analysis loading screen
  if (step === 'analyzing') {
    return <AnalysisLoading progress={analysisProgress} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Navigation */}
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent leading-tight">
              Get Your Resume Roasted
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            AI-powered resume feedback turning weak resumes into interview magnets.
              <br />
              <span className="text-orange-500 font-semibold">Because nice feedback won't get you hired.</span>
            </p>
            
            {/* Roast Limit Banner */}
            <div className="max-w-lg mx-auto">
              <RoastLimitBanner 
                remainingRoasts={remainingRoasts}
                maxRoasts={maxRoasts}
                canRoast={canRoast}
                tier={tier}
                isAuthenticated={isAuthenticated}
                onUpgrade={handleUpgrade}
              />
            </div>

            {/* File Upload, Method Selection, or Extracted Preview */}
            <div className="max-w-2xl mx-auto mb-8">
              {step === 'upload' ? (
                <div>
                  <FileUpload
                    selectedFile={selectedFile}
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    pdfImages={pdfImages || []}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'application/msword': ['.doc'],
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                      'text/plain': ['.txt']
                    }}
                  />
                  
                  {/* Extraction Loading */}
                  {isExtracting && selectedFile && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-3">
                        <Loader className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-blue-700">
                          Extracting text from {getFileTypeInfo(selectedFile).type} file...
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Extraction Error */}
                  {extractionError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-red-700 text-sm">{extractionError}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRetryExtraction}
                          disabled={!selectedFile}
                        >
                          Retry Extraction
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : step === 'method-select' ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Selected File:</h3>
                        <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleBackToUpload}>
                        Change File
                      </Button>
                    </div>
                  </div>
                  
                  <ExtractionMethodSelector
                    isRegistered={isAuthenticated}
                    onMethodSelect={handleExtractionMethodSelect}
                    selectedMethod={selectedExtractionMethod}
                    selectedProvider={selectedProvider}
                    selectedModel={selectedModel}
                    disabled={isExtracting}
                  />
                  
                  {/* Extraction Loading */}
                  {isExtracting && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-3">
                        <Loader className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-blue-700">
                          {selectedExtractionMethod === 'basic' 
                            ? 'Extracting text using basic method...' 
                            : selectedProvider === 'openai'
                            ? 'Processing with GPT-4 Mini...'
                            : 'Processing with Claude Sonnet 4...'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Extraction Error */}
                  {extractionError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-red-700 text-sm">{extractionError}</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRetryExtraction}
                          disabled={!selectedFile}
                        >
                          Retry Extraction
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                extractedData && (
                  <div>
                    {/* Show extraction method used */}
                    {currentExtractionMethod && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Extraction Method:</strong> {currentExtractionMethod === 'basic' ? 'Basic Text Extraction' : 'AI-Powered Extraction'}
                          {extractedData.metadata.fromCache && ' (from cache)'}
                        </p>
                      </div>
                    )}
                    
                    {/* Re-run Loading Indicator */}
                    {isExtracting && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-center space-x-3">
                          <Loader className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="text-blue-700">
                            Re-running extraction with {selectedExtractionMethod === 'basic' 
                              ? 'basic method...' 
                              : selectedProvider === 'openai'
                              ? 'GPT-4 Mini...'
                              : 'Claude Sonnet 4...'
                            }
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <ExtractedTextPreview 
                      data={extractedData}
                      images={pdfImages}
                      onProceed={handleStartRoasting}
                      onRerun={handleRerun}
                      currentMethod={selectedExtractionMethod}
                      currentProvider={selectedProvider}
                      currentModel={selectedModel}
                      isProcessing={isExtracting}
                      isAnalyzing={false}
                    />
                  </div>
                )
              )}
            </div>

          </div>
        </div>
      </section>

      {/* PostHog Test Section - TEMPORARY FOR TESTING */}
      {/* <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto">
          <PostHogTest />
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Resume Roaster?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop getting polite feedback that doesn't help. Get the brutal truth that transforms your resume into an interview magnet.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Demo Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 max-w-2xl mx-auto">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">
                See Our Resume Template in Action
              </h4>
              <p className="text-gray-600 mb-6">
                Check out our professional resume template - clean, ATS-optimized, and interview-ready.
              </p>
              <Button 
                size="lg" 
                variant="outline" 
                className="group border-orange-300 hover:bg-orange-50"
                onClick={() => router.push('/demo')}
              >
                <Eye className="mr-2 h-5 w-5" />
                View Template Demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Resume?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join many job seekers who've improved their interview rates with AI-powered Resume Roaster.
            </p>
            <Button size="lg" variant="secondary" className="group" onClick={handleUpgrade}>
              <Upload className="mr-2 h-5 w-5" />
              Upgrade to Premium
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      
      {/* Alert Dialog */}
      {AlertDialog}

      {/* Resume Analysis Modal */}
      <ResumeAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => {
          setShowAnalysisModal(false)
          setPendingAnalysisData(null)
        }}
        onConfirm={handleAnalysisConfirm}
        isAnalyzing={false}
      />
    </div>
  )
}
