"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { useCoverLetter } from "@/hooks/useCoverLetter"
import { 
  FileText, 
  Download, 
  Copy, 
  Sparkles, 
  Clock, 
  Target,
  Loader,
  CheckCircle,
  AlertCircle,
  Zap,
  Rocket,
  Car,
  Turtle,
  Mail,
  User,
  Briefcase
} from "lucide-react"
import { toast } from 'sonner'
import { OPENAI_MODELS, ANTHROPIC_MODELS } from "@/lib/constants"

interface CoverLetterModalProps {
  isOpen: boolean
  onClose: () => void
  resumeData: any
  jobDescription?: string
  analysisData?: any
  roastId?: string
  onCoverLetterGenerated?: (cached: boolean, usageCount: number) => void
}

export function CoverLetterModal({ 
  isOpen, 
  onClose, 
  resumeData, 
  jobDescription, 
  analysisData, 
  roastId,
  onCoverLetterGenerated
}: CoverLetterModalProps) {
  const [selectedTone, setSelectedTone] = useState('professional')
  const [selectedLLM, setSelectedLLM] = useState<string>(OPENAI_MODELS.NANO)
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null)
  const [letterMetadata, setLetterMetadata] = useState<any>(null)
  const { generateCoverLetter, isGenerating, error } = useCoverLetter()

  const toneOptions = [
    { 
      value: 'professional', 
      label: 'Professional', 
      description: 'Formal and confident tone',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      value: 'enthusiastic', 
      label: 'Enthusiastic', 
      description: 'Energetic and passionate tone',
      icon: Sparkles,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    { 
      value: 'conversational', 
      label: 'Conversational', 
      description: 'Friendly but professional tone',
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ]

  const llmOptions = [
    { 
      value: OPENAI_MODELS.NANO,
      label: 'OpenAI Nano', 
      description: 'Basic generation for simple tasks',
      credits: 1,
      icon: Rocket,
      badge: 'Basic',
      recommended: true
    },
    { 
      value: OPENAI_MODELS.MINI,
      label: 'OpenAI Mini', 
      description: 'Fast and efficient generation',
      credits: 4,
      icon: Zap,
      badge: 'Fast',
      recommended: false
    },
    { 
      value: ANTHROPIC_MODELS.SONNET, 
      label: 'Claude Sonnet 4', 
      description: 'Premium quality with superior accuracy',
      credits: 8,
      icon: Car,
      badge: 'Premium',
      recommended: false
    },
    { 
      value: ANTHROPIC_MODELS.OPUS, 
      label: 'Claude Opus 4', 
      description: 'Ultimate quality for complex generation',
      credits: 12,
      icon: Turtle,
      badge: 'Ultimate',
      recommended: false
    }
  ]

  const handleGenerate = async () => {
    if (!jobDescription) {
      toast.error('Job description is required to generate a cover letter')
      return
    }

    const result = await generateCoverLetter(resumeData, jobDescription, analysisData, selectedTone, roastId, selectedLLM)
    if (result) {
      setGeneratedLetter(result.coverLetter)
      setLetterMetadata({
        ...result.metadata,
        cached: result.cached,
        usageCount: result.usageCount,
        wordCount: result.wordCount,
        llmUsed: selectedLLM,
        creditsUsed: llmOptions.find(llm => llm.value === selectedLLM)?.credits || 1
      })
      if (onCoverLetterGenerated) {
        onCoverLetterGenerated(result.cached || false, result.usageCount || 1)
      }
    }
  }

  const handleCopy = async () => {
    if (generatedLetter) {
      try {
        await navigator.clipboard.writeText(generatedLetter)
        toast.success('Cover letter copied to clipboard!')
      } catch (err) {
        toast.error('Failed to copy to clipboard')
      }
    }
  }

  const handleDownload = () => {
    if (generatedLetter) {
      const blob = new Blob([generatedLetter], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cover-letter-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Cover letter downloaded!')
    }
  }

  const handleClose = () => {
    setGeneratedLetter(null)
    setLetterMetadata(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <span>AI Cover Letter Generator</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!generatedLetter ? (
            <div className="h-full overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Hero Section */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI-Powered Cover Letter Generator
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Create a personalized cover letter that perfectly matches your resume to the job description. 
                    Stand out from other candidates with AI-crafted content.
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-blue-900 mb-1">Targeted Content</h4>
                      <p className="text-sm text-blue-700">Tailored to your specific job and experience</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <Sparkles className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-green-900 mb-1">Professional Tone</h4>
                      <p className="text-sm text-green-700">Choose from multiple writing styles</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-purple-900 mb-1">Instant Results</h4>
                      <p className="text-sm text-purple-700">Generated in seconds, ready to send</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Generation Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      <span>Customize Your Cover Letter</span>
                    </CardTitle>
                    <CardDescription>
                      Choose your preferred tone and AI model for the best results
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Tone Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Choose Writing Tone
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {toneOptions.map((tone) => {
                          const IconComponent = tone.icon
                          return (
                            <div
                              key={tone.value}
                              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                selectedTone === tone.value
                                  ? `${tone.borderColor} ${tone.bgColor}`
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedTone(tone.value)}
                            >
                              <div className="flex items-center space-x-3 mb-2">
                                <div className={`p-2 ${tone.bgColor} rounded-lg`}>
                                  <IconComponent className={`h-5 w-5 ${tone.color}`} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{tone.label}</h4>
                                  <p className="text-sm text-gray-600">{tone.description}</p>
                                </div>
                              </div>
                              {selectedTone === tone.value && (
                                <div className="absolute top-2 right-2">
                                  <CheckCircle className={`h-4 w-4 ${tone.color}`} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <Separator />

                    {/* AI Model Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-3 block">
                        Choose AI Model
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {llmOptions.map((llm) => {
                          const IconComponent = llm.icon
                          return (
                            <div
                              key={llm.value}
                              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                selectedLLM === llm.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedLLM(llm.value)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <IconComponent className="h-5 w-5 text-blue-600" />
                                  <span className="font-medium text-gray-900">{llm.label}</span>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                    {llm.badge}
                                  </Badge>
                                  {llm.recommended && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                      Recommended
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                    {llm.credits} Credit{llm.credits !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{llm.description}</p>
                              {selectedLLM === llm.value && (
                                <div className="absolute top-2 left-2">
                                  <CheckCircle className="h-4 w-4 text-blue-500" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <Separator />

                    {/* Requirements Check */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">Requirements Check</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {resumeData ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Resume data available</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {jobDescription ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">Job description available</span>
                        </div>
                        {analysisData && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Analysis insights will be included</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!jobDescription && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800">Job Description Required</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              A job description is required to generate a targeted cover letter. 
                              Please go back and add a job description to your analysis.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !jobDescription || !resumeData}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="h-5 w-5 mr-2 animate-spin" />
                          Generating Cover Letter...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate Cover Letter
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Error: {error}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Success Header */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Cover Letter Generated Successfully! 🎉
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Your personalized cover letter is ready. Review and customize as needed.
                  </p>
                </div>

                {/* Metadata */}
                {letterMetadata && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Target className="h-3 w-3 mr-1" />
                            {selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)} Tone
                          </Badge>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <FileText className="h-3 w-3 mr-1" />
                            {letterMetadata.wordCount || 0} words
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Clock className="h-3 w-3 mr-1" />
                            {Math.round(letterMetadata.processingTime / 1000)}s
                          </Badge>
                          {letterMetadata.cached && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Cached ({letterMetadata.usageCount} uses)
                            </Badge>
                          )}
                          {letterMetadata.llmUsed && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              {letterMetadata.llmUsed === OPENAI_MODELS.NANO ? (
                                <Rocket className="h-3 w-3 mr-1" />
                              ) : letterMetadata.llmUsed === OPENAI_MODELS.MINI ? (
                                <Zap className="h-3 w-3 mr-1" />
                              ) : letterMetadata.llmUsed === ANTHROPIC_MODELS.SONNET ? (
                                <Car className="h-3 w-3 mr-1" />
                              ) : (
                                <Turtle className="h-3 w-3 mr-1" />
                              )}
                              {letterMetadata.llmUsed === OPENAI_MODELS.NANO ? 'OpenAI Nano' :
                               letterMetadata.llmUsed === OPENAI_MODELS.MINI ? 'OpenAI Mini' :
                               letterMetadata.llmUsed === ANTHROPIC_MODELS.SONNET ? 'Claude Sonnet 4' :
                               letterMetadata.llmUsed === ANTHROPIC_MODELS.OPUS ? 'Claude Opus 4' :
                               'Unknown Model'}
                            </Badge>
                          )}
                          {letterMetadata.creditsUsed && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {letterMetadata.creditsUsed} Credit{letterMetadata.creditsUsed !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={handleCopy}>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cover Letter Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Generated Cover Letter</CardTitle>
                    <CardDescription>
                      Review and customize as needed before using
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white border rounded-lg p-6 min-h-[400px]">
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {generatedLetter}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setGeneratedLetter(null)
                      setLetterMetadata(null)
                    }}
                  >
                    Generate New Letter
                  </Button>
                  <Button onClick={handleClose} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 