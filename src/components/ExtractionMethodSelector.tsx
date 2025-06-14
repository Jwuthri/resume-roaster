"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle,
  Rocket,
  Car,
  Turtle,
  AlertCircle
} from 'lucide-react'
import { OPENAI_MODELS, ANTHROPIC_MODELS, getModelCreditCost } from '@/lib/constants'

interface ExtractionMethodSelectorProps {
  isRegistered: boolean
  onMethodSelect: (method: 'basic' | 'ai', provider?: 'anthropic' | 'openai', model?: string) => void
  selectedMethod?: 'basic' | 'ai'
  selectedProvider?: 'anthropic' | 'openai'
  selectedModel?: string
  disabled?: boolean
}

export function ExtractionMethodSelector({ 
  isRegistered, 
  onMethodSelect, 
  selectedMethod = 'ai', // Default to AI extraction
  selectedProvider = 'openai', // Default to OpenAI Mini
  selectedModel,
  disabled = false 
}: ExtractionMethodSelectorProps) {
  const [currentMethod, setCurrentMethod] = useState<'basic' | 'ai'>(selectedMethod)
  const [currentModel, setCurrentModel] = useState<string>(selectedModel || OPENAI_MODELS.MINI)

  const extractionOptions = [
    {
      id: 'basic',
      type: 'basic' as const,
      title: 'Free Extraction',
      description: 'Basic text extraction for simple tasks',
      icon: FileText,
      credits: 0,
      badge: 'Free',
      recommended: false,
      color: 'bg-green-50 border-green-200'
    },
    { 
      id: 'openai-nano',
      type: 'ai' as const,
      provider: 'openai' as const,
      model: OPENAI_MODELS.NANO,
      title: 'OpenAI Nano', 
      description: 'Basic generation for simple tasks',
      credits: getModelCreditCost(OPENAI_MODELS.NANO),
      icon: Rocket,
      badge: 'Basic',
      recommended: true,
      color: 'bg-purple-50 border-purple-200'
    },
    { 
      id: 'openai-mini',
      type: 'ai' as const,
      provider: 'openai' as const,
      model: OPENAI_MODELS.MINI,
      title: 'OpenAI Mini', 
      description: 'Fast and efficient generation',
      credits: getModelCreditCost(OPENAI_MODELS.MINI),
      icon: Zap,
      badge: 'Fast',
      recommended: false,
      color: 'bg-blue-50 border-blue-200'
    },
    { 
      id: 'openai-normal',
      type: 'ai' as const,
      provider: 'openai' as const,
      model: OPENAI_MODELS.NORMAL,
      title: 'OpenAI Normal', 
      description: 'Advanced generation with superior quality',
      credits: getModelCreditCost(OPENAI_MODELS.NORMAL),
      icon: Car,
      badge: 'Advanced',
      recommended: false,
      color: 'bg-green-50 border-green-200'
    },
    { 
      id: 'claude-sonnet',
      type: 'ai' as const,
      provider: 'anthropic' as const,
      model: ANTHROPIC_MODELS.SONNET,
      title: 'Claude Sonnet 4', 
      description: 'Premium quality with superior accuracy',
      credits: getModelCreditCost(ANTHROPIC_MODELS.SONNET),
      icon: Car,
      badge: 'Premium',
      recommended: false,
      color: 'bg-purple-50 border-purple-200'
    },
    { 
      id: 'claude-opus',
      type: 'ai' as const,
      provider: 'anthropic' as const,
      model: ANTHROPIC_MODELS.OPUS,
      title: 'Claude Opus 4', 
      description: 'Ultimate quality for complex generation',
      credits: getModelCreditCost(ANTHROPIC_MODELS.OPUS),
      icon: Turtle,
      badge: 'Ultimate',
      recommended: false,
      color: 'bg-purple-50 border-purple-200'
    }
  ]

  const handleMethodSelect = (option: any) => {
    setCurrentMethod(option.type)
    if (option.type === 'ai') {
      setCurrentModel(option.model)
    }
    // Don't call the API here - just update the selection
  }

  const handleStartExtraction = () => {
    const option = getSelectedOption()
    if (option) {
      if (option.type === 'ai') {
        onMethodSelect(option.type, option.provider, option.model)
      } else {
        onMethodSelect(option.type)
      }
    }
  }

  const getSelectedOption = () => {
    if (currentMethod === 'basic') {
      return extractionOptions.find(opt => opt.type === 'basic')
    } else {
      return extractionOptions.find(opt => opt.model === currentModel) || extractionOptions.find(opt => opt.id === 'openai-mini')
    }
  }

  const selectedOption = getSelectedOption()

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2 text-blue-600">
          <FileText className="h-5 w-5" />
          <CardTitle>PDF Extraction Method</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Extraction Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {extractionOptions.map((option) => {
              const IconComponent = option.icon
              const isSelected = (currentMethod === 'basic' && option.type === 'basic') || 
                               (currentMethod === 'ai' && option.model === currentModel)
              
              return (
                <div
                  key={option.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : `border-gray-200 hover:border-gray-300 ${option.color}`
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !disabled && handleMethodSelect(option)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-gray-900 text-sm">{option.title}</span>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          option.badge === 'Free' ? 'bg-green-100 text-green-700 border-green-200' :
                          option.badge === 'Basic' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          option.badge === 'Fast' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          option.badge === 'Premium' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          'bg-purple-100 text-purple-700 border-purple-200'
                        }`}
                      >
                        {option.badge}
                      </Badge>
                      {option.recommended && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                          Recommended
                        </Badge>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          option.credits === 0 ? 'bg-green-100 text-green-800' :
                          option.credits <= 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {option.credits === 0 ? 'Free' : `${option.credits} Credit${option.credits !== 1 ? 's' : ''}`}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                  {isSelected && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Requirements Check */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">PDF file uploaded</span>
          </div>
          <div className="flex items-center space-x-2">
            {isRegistered ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-sm">
              {isRegistered ? 'Account registered - all methods available' : 'Guest mode - only free extraction available'}
            </span>
          </div>
        </div>

        {!isRegistered && currentMethod === 'ai' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              AI extraction requires a registered account. Please sign up to access premium extraction methods.
            </p>
          </div>
        )}

        <Button 
          onClick={handleStartExtraction}
          disabled={disabled || (!isRegistered && currentMethod === 'ai')}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          {disabled ? (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Start Extraction
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 