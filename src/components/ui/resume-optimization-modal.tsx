"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { 
  FileText, 
  Sparkles, 
  Loader,
  CheckCircle,
  AlertCircle,
  Zap,
  Turtle,
  Rocket,
  Car,
  Target,
  TrendingUp,
  Award
} from "lucide-react"
import { toast } from 'sonner'
import { OPENAI_MODELS, ANTHROPIC_MODELS } from "@/lib/constants"

interface ResumeOptimizationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedLLM: string) => void
  isGenerating?: boolean
}

export function ResumeOptimizationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  isGenerating = false
}: ResumeOptimizationModalProps) {
  const [selectedLLM, setSelectedLLM] = useState<string>(ANTHROPIC_MODELS.SONNET)

  const llmOptions = [
    { 
      value: OPENAI_MODELS.NANO, 
      label: 'OpenAI Nano', 
      description: 'Basic optimization for simple tasks',
      credits: 1,
      icon: Rocket,
      badge: 'Basic',
      recommended: false
    },
    { 
      value: OPENAI_MODELS.MINI, 
      label: 'OpenAI Mini', 
      description: 'Fast and efficient optimization',
      credits: 4,
      icon: Zap,
      badge: 'Fast',
      recommended: false
    },
    { 
      value: OPENAI_MODELS.NORMAL, 
      label: 'OpenAI Normal', 
      description: 'Advanced optimization with superior quality',
      credits: 8,
      icon: Car,
      badge: 'Advanced',
      recommended: false
    },
    { 
      value: ANTHROPIC_MODELS.SONNET, 
      label: 'Claude Sonnet 4', 
      description: 'Premium quality with superior accuracy',
      credits: 8,
      icon: Car,
      badge: 'Premium',
      recommended: true
    },
    { 
      value: ANTHROPIC_MODELS.OPUS, 
      label: 'Claude Opus 4', 
      description: 'Ultimate quality for complex optimization',
      credits: 12,
      icon: Turtle,
      badge: 'Ultimate',
      recommended: false
    }
  ]

  const handleConfirm = () => {
    onConfirm(selectedLLM)
  }

  const handleClose = () => {
    if (!isGenerating) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            <span>Resume Optimization</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI-Powered Resume Optimization
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Get personalized resume optimization based on your resume and the target job. 
                Enhance your keywords, formatting, and content to stand out from other candidates.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-900 mb-1">Targeted Keywords</h4>
                  <p className="text-sm text-blue-700">Optimized for your specific job posting</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-900 mb-1">Enhanced Content</h4>
                  <p className="text-sm text-green-700">Improved formatting and structure</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-purple-900 mb-1">ATS Optimized</h4>
                  <p className="text-sm text-purple-700">Passes applicant tracking systems</p>
                </CardContent>
              </Card>
            </div>

            {/* Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-orange-600" />
                  <span>Generate Your Resume Optimization</span>
                </CardTitle>
                <CardDescription>
                  Create personalized resume optimization based on your resume and the job description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedLLM(llm.value)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <IconComponent className="h-5 w-5 text-orange-600" />
                              <span className="font-medium text-gray-900">{llm.label}</span>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                                {llm.badge}
                              </Badge>
                              {llm.recommended && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                  Recommended
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                                {llm.credits} Credit{llm.credits !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{llm.description}</p>
                          {selectedLLM === llm.value && (
                            <div className="absolute top-2 left-2">
                              <CheckCircle className="h-4 w-4 text-orange-500" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Requirements Check */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Requirements Check</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Resume data available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Job description available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Analysis insights will be included</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  onClick={handleConfirm}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Generating Optimization...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate Optimized Resume
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 