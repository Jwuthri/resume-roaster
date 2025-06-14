"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card"
import { Badge } from "./badge"
import { Separator } from "./separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { 
  MessageCircle, 
  Brain, 
  Target, 
  Users, 
  Code, 
  CheckCircle, 
  Clock, 
  Star,
  RefreshCw,
  Download,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Loader2,
  BarChart3,
  AlertCircle,
  Zap,
  Rocket,
  Car,
  Turtle
} from "lucide-react"
import { toast } from 'sonner'
import { useSubscription } from "@/hooks/useSubscription"
import { OPENAI_MODELS, ANTHROPIC_MODELS } from "@/lib/constants"

interface InterviewQuestion {
  id: string
  question: string
  category: 'behavioral' | 'technical' | 'situational' | 'general'
  difficulty: 'easy' | 'medium' | 'hard'
  suggestedAnswer: string
  tips: string[]
  followUpQuestions?: string[]
}

interface InterviewPrepData {
  questions: InterviewQuestion[]
  overallTips: string[]
  companyResearch?: string[]
  salaryNegotiation?: string[]
}

interface InterviewPrepModalProps {
  isOpen: boolean
  onClose: () => void
  resumeData: any
  jobDescription?: string
  analysisData?: any
  roastId?: string
  onInterviewPrepGenerated?: (cached: boolean) => void
}

export function InterviewPrepModal({
  isOpen,
  onClose,
  resumeData,
  jobDescription,
  analysisData,
  roastId,
  onInterviewPrepGenerated
}: InterviewPrepModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedLLM, setSelectedLLM] = useState<string>(OPENAI_MODELS.MINI)
  const [interviewData, setInterviewData] = useState<InterviewPrepData | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [activeTab, setActiveTab] = useState("questions")
  const [practiceMode, setPracticeMode] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [answerEvaluations, setAnswerEvaluations] = useState<Record<string, any>>({})
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [sessionEvaluation, setSessionEvaluation] = useState<any>(null)
  const [isEvaluatingSession, setIsEvaluatingSession] = useState(false)
  const [savedEvaluations, setSavedEvaluations] = useState<any[]>([])
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false)
  
  const { subscription } = useSubscription()

  const llmOptions = [
    { 
      value: OPENAI_MODELS.NANO,
      label: 'OpenAI Nano', 
      description: 'Basic generation for simple tasks',
      credits: 1,
      icon: Rocket,
      badge: 'Basic',
      recommended: false
    },
    { 
      value: OPENAI_MODELS.MINI,
      label: 'OpenAI Mini', 
      description: 'Fast and efficient generation',
      credits: 4,
      icon: Zap,
      badge: 'Fast',
      recommended: true
    },
    { 
      value: OPENAI_MODELS.NORMAL,
      label: 'OpenAI Normal', 
      description: 'Advanced generation with superior quality',
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const generateInterviewPrep = async () => {
    if (!resumeData) {
      toast.error('Resume data not available')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-interview-prep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          jobDescription,
          analysisData,
          roastId,
          llm: selectedLLM
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate interview prep')
      }

      const data = await response.json()
      setInterviewData(data.interviewPrep)
      toast.success('Interview prep generated successfully!')
      
      if (onInterviewPrepGenerated) {
        onInterviewPrepGenerated(data.cached)
      }
    } catch (error) {
      console.error('Error generating interview prep:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate interview prep')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadInterviewPrep = async () => {
    if (!interviewData) return

    try {
      const response = await fetch('/api/download-interview-prep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewData,
          resumeData,
          jobDescription
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate download')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'interview-prep.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Interview prep downloaded!')
    } catch (error) {
      console.error('Error downloading interview prep:', error)
      toast.error('Failed to download interview prep')
    }
  }

  const startPracticeMode = () => {
    setPracticeMode(true)
    setCurrentQuestionIndex(0)
    setTimer(0)
    setIsTimerRunning(true)
  }

  const nextQuestion = () => {
    if (interviewData && currentQuestionIndex < interviewData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setTimer(0)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setTimer(0)
    }
  }

  const resetPractice = () => {
    setCurrentQuestionIndex(0)
    setTimer(0)
    setIsTimerRunning(false)
    setUserAnswers({})
    setAnswerEvaluations({})
    setSessionEvaluation(null)
  }

  const evaluateAnswer = async (questionId: string) => {
    const question = interviewData?.questions.find(q => q.id === questionId)
    const userAnswer = userAnswers[questionId]
    
    if (!question || !userAnswer || userAnswer.trim().length === 0) {
      toast.error('Please provide an answer before requesting evaluation')
      return
    }

    setIsEvaluating(true)
    
    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAnswer: userAnswer.trim(),
          question: question.question,
          suggestedAnswer: question.suggestedAnswer,
          tips: question.tips,
          category: question.category,
          difficulty: question.difficulty,
          roastId,
          questionId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate answer')
      }

      const data = await response.json()
      setAnswerEvaluations(prev => ({
        ...prev,
        [questionId]: data.evaluation
      }))
      
      toast.success('Answer evaluated! Check the feedback below.')
      
    } catch (error) {
      console.error('Error evaluating answer:', error)
      toast.error('Failed to evaluate answer. Please try again.')
    } finally {
      setIsEvaluating(false)
    }
  }

  const evaluateSession = async () => {
    if (!interviewData) return

    // Check if ALL questions have been answered
    const allQuestionsAnswered = interviewData.questions.every(q => 
      userAnswers[q.id] && userAnswers[q.id].trim().length > 0
    )

    if (!allQuestionsAnswered) {
      const answeredCount = interviewData.questions.filter(q => 
        userAnswers[q.id] && userAnswers[q.id].trim().length > 0
      ).length
      toast.error(`Please answer all ${interviewData.questions.length} questions before evaluating the session. You've answered ${answeredCount}/${interviewData.questions.length}.`)
      return
    }

    setIsEvaluatingSession(true)
    
    try {
      const response = await fetch('/api/evaluate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: interviewData.questions,
          userAnswers,
          roastId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate practice session')
      }

      const data = await response.json()
      setSessionEvaluation(data.evaluation)
      
      // Add to saved evaluations
      const newEvaluation = {
        id: data.id || Date.now(),
        evaluation: data.evaluation,
        timestamp: new Date().toISOString(),
        questionsCount: data.questionsEvaluated
      }
      setSavedEvaluations(prev => [newEvaluation, ...prev])
      
      toast.success(`Practice session evaluated! All ${data.questionsEvaluated} questions analyzed.`)
      
      // Switch to results tab to show the evaluation
      setActiveTab('results')
      
    } catch (error) {
      console.error('Error evaluating practice session:', error)
      toast.error('Failed to evaluate practice session. Please try again.')
    } finally {
      setIsEvaluatingSession(false)
    }
  }

  const loadSavedEvaluations = async () => {
    if (!roastId) return

    setIsLoadingEvaluations(true)
    try {
      const response = await fetch(`/api/evaluations/${roastId}`)
      if (response.ok) {
        const data = await response.json()
        setSavedEvaluations(data.evaluations || [])
      }
    } catch (error) {
      console.error('Error loading saved evaluations:', error)
    } finally {
      setIsLoadingEvaluations(false)
    }
  }

  // Load saved evaluations when modal opens
  useEffect(() => {
    if (isOpen && roastId) {
      loadSavedEvaluations()
    }
  }, [isOpen, roastId])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'behavioral': return <Users className="h-4 w-4" />
      case 'technical': return <Code className="h-4 w-4" />
      case 'situational': return <Target className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const currentQuestion = interviewData?.questions[currentQuestionIndex]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <span>Interview Preparation</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!interviewData ? (
            <div className="h-full overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    AI-Powered Interview Preparation
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Get personalized interview questions based on your resume and the target job. 
                    Practice with realistic scenarios and receive expert tips to ace your interview.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-blue-900 mb-1">Tailored Questions</h4>
                      <p className="text-sm text-blue-700">Questions specific to your experience and the role</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-green-900 mb-1">Practice Mode</h4>
                      <p className="text-sm text-green-700">Timed practice sessions with feedback</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold text-purple-900 mb-1">Expert Tips</h4>
                      <p className="text-sm text-purple-700">Professional advice for each question</p>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Model Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <span>Generate Your Interview Prep</span>
                    </CardTitle>
                    <CardDescription>
                      Create personalized interview questions based on your resume and the job description
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* LLM Selection */}
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
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedLLM(llm.value)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <IconComponent className={`h-5 w-5 ${
                                    llm.value === OPENAI_MODELS.MINI ? 'text-blue-600' : 'text-purple-600'
                                  }`} />
                                  <span className="font-medium text-gray-900">{llm.label}</span>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  <Badge variant="outline" className={`text-xs ${
                                    llm.value === OPENAI_MODELS.MINI 
                                      ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                      : 'bg-purple-100 text-purple-700 border-purple-200'
                                  }`}>
                                    {llm.badge}
                                  </Badge>
                                  {llm.recommended && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                                      Recommended
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className={`text-xs ${
                                    llm.value === OPENAI_MODELS.MINI
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {llm.credits} Credit{llm.credits !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{llm.description}</p>
                              {selectedLLM === llm.value && (
                                <div className="absolute top-2 left-2">
                                  <CheckCircle className="h-4 w-4 text-purple-500" />
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
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm">Job description {jobDescription ? 'available' : 'optional'}</span>
                      </div>
                      {analysisData && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Analysis insights will be included</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={generateInterviewPrep}
                      disabled={isGenerating || !resumeData}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Generating Interview Prep...
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5 mr-2" />
                          Generate Interview Prep
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {(!subscription || subscription.tier === 'FREE') && (
                  <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-orange-700 mb-2">
                        <strong>Free users:</strong> Get 3 interview prep sessions per month
                      </p>
                      <p className="text-xs text-orange-600">
                        Upgrade to Plus for unlimited access and advanced features
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-4 mx-4 mt-4 mb-2">
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                  <TabsTrigger value="practice">Practice Mode</TabsTrigger>
                  <TabsTrigger value="tips">Tips & Research</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="flex-1 overflow-y-auto px-4 pb-4 m-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Interview Questions</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadInterviewPrep}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {interviewData.questions.map((question, index) => (
                        <Card key={question.id} className="border-l-4 border-l-purple-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                {getCategoryIcon(question.category)}
                                <span className="font-medium capitalize">{question.category}</span>
                                <Badge className={getDifficultyColor(question.difficulty)}>
                                  {question.difficulty}
                                </Badge>
                              </div>
                              <span className="text-sm text-gray-500">#{index + 1}</span>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Question:</h4>
                              <p className="text-gray-700">{question.question}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Suggested Answer:</h4>
                              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{question.suggestedAnswer}</p>
                            </div>
                            
                            {question.tips.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Tips:</h4>
                                <ul className="space-y-1">
                                  {question.tips.map((tip, tipIndex) => (
                                    <li key={tipIndex} className="flex items-start space-x-2">
                                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {question.followUpQuestions && question.followUpQuestions.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Potential Follow-ups:</h4>
                                <ul className="space-y-1">
                                  {question.followUpQuestions.map((followUp, followUpIndex) => (
                                    <li key={followUpIndex} className="text-sm text-gray-600 ml-4">
                                      • {followUp}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="practice" className="flex-1 overflow-y-auto px-4 pb-4 m-0">
                  {!practiceMode ? (
                    <div className="text-center space-y-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Play className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Practice Mode</h3>
                        <p className="text-gray-600 mb-6">
                          Practice answering questions with a timer. This will help you prepare for the real interview pace.
                        </p>
                      </div>
                      <Button onClick={startPracticeMode} className="bg-green-600 hover:bg-green-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Practice Session
                      </Button>
                    </div>
                  ) : currentQuestion ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            Question {currentQuestionIndex + 1} of {interviewData.questions.length}
                          </span>
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(currentQuestion.category)}
                            <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                              {currentQuestion.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="font-mono text-lg">{formatTime(timer)}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                          >
                            {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetPractice}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Card>
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
                          <textarea
                            className="w-full h-32 p-3 border rounded-lg resize-none"
                            placeholder="Practice your answer here..."
                            value={userAnswers[currentQuestion.id] || ''}
                            onChange={(e) => setUserAnswers(prev => ({
                              ...prev,
                              [currentQuestion.id]: e.target.value
                            }))}
                          />
                          
                          {/* Evaluate Answer Button */}
                          <div className="mt-4 flex justify-between items-center">
                            <Button
                              onClick={() => evaluateAnswer(currentQuestion.id)}
                              disabled={isEvaluating || !userAnswers[currentQuestion.id]?.trim()}
                              className="bg-blue-600 hover:bg-blue-700"
                              size="sm"
                            >
                              {isEvaluating ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Evaluating...
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Get AI Feedback
                                </>
                              )}
                            </Button>
                            
                            {answerEvaluations[currentQuestion.id] && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Score:</span>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  answerEvaluations[currentQuestion.id].score >= 80 
                                    ? 'bg-green-100 text-green-800'
                                    : answerEvaluations[currentQuestion.id].score >= 60
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }`}>
                                  {answerEvaluations[currentQuestion.id].score}/100
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Evaluation Results */}
                          {answerEvaluations[currentQuestion.id] && (
                            <div className="mt-6 space-y-4 border-t pt-4">
                              <h4 className="font-semibold text-gray-900">AI Feedback</h4>
                              
                              {/* Overall Feedback */}
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800">
                                  {answerEvaluations[currentQuestion.id].overallFeedback}
                                </p>
                              </div>
                              
                              {/* Strengths */}
                              {answerEvaluations[currentQuestion.id].strengths?.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-green-700 mb-2">✅ Strengths</h5>
                                  <ul className="space-y-1">
                                    {answerEvaluations[currentQuestion.id].strengths.map((strength: string, index: number) => (
                                      <li key={index} className="text-sm text-green-700 flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{strength}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Improvements */}
                              {answerEvaluations[currentQuestion.id].improvements?.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-orange-700 mb-2">🔧 Areas for Improvement</h5>
                                  <ul className="space-y-1">
                                    {answerEvaluations[currentQuestion.id].improvements.map((improvement: string, index: number) => (
                                      <li key={index} className="text-sm text-orange-700 flex items-start space-x-2">
                                        <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{improvement}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Missing Elements */}
                              {answerEvaluations[currentQuestion.id].missingElements?.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-red-700 mb-2">❌ Missing Key Points</h5>
                                  <ul className="space-y-1">
                                    {answerEvaluations[currentQuestion.id].missingElements.map((missing: string, index: number) => (
                                      <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{missing}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Follow-up Suggestions */}
                              {answerEvaluations[currentQuestion.id].followUpSuggestions?.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-purple-700 mb-2">💡 Suggestions</h5>
                                  <ul className="space-y-1">
                                    {answerEvaluations[currentQuestion.id].followUpSuggestions.map((suggestion: string, index: number) => (
                                      <li key={index} className="text-sm text-purple-700 flex items-start space-x-2">
                                        <Brain className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{suggestion}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={previousQuestion}
                          disabled={currentQuestionIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                        <Button
                          onClick={nextQuestion}
                          disabled={currentQuestionIndex === interviewData.questions.length - 1}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>

                      {/* Session Evaluation Button */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">Complete Session Evaluation</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Answer all {interviewData.questions.length} questions to get comprehensive feedback
                            </p>
                          </div>
                          <Button
                            onClick={evaluateSession}
                            disabled={isEvaluatingSession || !interviewData.questions.every(q => userAnswers[q.id] && userAnswers[q.id].trim().length > 0)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            {isEvaluatingSession ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Evaluating...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Evaluate Session
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {/* Progress indicator */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>
                              {interviewData.questions.filter(q => userAnswers[q.id] && userAnswers[q.id].trim().length > 0).length} / {interviewData.questions.length} answered
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(interviewData.questions.filter(q => userAnswers[q.id] && userAnswers[q.id].trim().length > 0).length / interviewData.questions.length) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="tips" className="flex-1 overflow-y-auto px-4 pb-4 m-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">General Interview Tips</h3>
                      <div className="grid gap-3">
                        {interviewData.overallTips.map((tip, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {interviewData.companyResearch && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Company Research</h3>
                        <div className="grid gap-3">
                          {interviewData.companyResearch.map((item, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                              <Target className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {interviewData.salaryNegotiation && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Salary Negotiation</h3>
                        <div className="grid gap-3">
                          {interviewData.salaryNegotiation.map((item, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                              <Star className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="results" className="flex-1 overflow-y-auto px-4 pb-4 m-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Evaluation Results</h3>
                      {isLoadingEvaluations && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </div>
                      )}
                    </div>

                    {/* Current Session Evaluation */}
                    {sessionEvaluation && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-md font-semibold text-gray-900">Current Session</h4>
                          <Badge className="bg-green-100 text-green-800">Latest</Badge>
                        </div>
                        
                        {/* Overall Score */}
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-gray-900">Overall Session Score</h5>
                            <div className="flex items-center">
                              <div className={`text-2xl font-bold ${
                                sessionEvaluation.overallScore >= 80 ? 'text-green-600' :
                                sessionEvaluation.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {sessionEvaluation.overallScore}
                              </div>
                              <span className="text-gray-500 ml-1">/100</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                sessionEvaluation.overallScore >= 80 ? 'bg-green-500' :
                                sessionEvaluation.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${sessionEvaluation.overallScore}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Session Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h6 className="font-semibold text-green-800 mb-2 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Strongest Areas
                            </h6>
                            <ul className="space-y-1">
                              {sessionEvaluation.sessionSummary.strongestAreas.map((area: string, index: number) => (
                                <li key={index} className="text-green-700 text-sm">• {area}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-orange-50 p-4 rounded-lg">
                            <h6 className="font-semibold text-orange-800 mb-2 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Areas for Improvement
                            </h6>
                            <ul className="space-y-1">
                              {sessionEvaluation.sessionSummary.improvementAreas.map((area: string, index: number) => (
                                <li key={index} className="text-orange-700 text-sm">• {area}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h6 className="font-semibold text-blue-800 mb-2 flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Next Steps
                          </h6>
                          <ul className="space-y-1">
                            {sessionEvaluation.sessionSummary.nextSteps.map((step: string, index: number) => (
                              <li key={index} className="text-blue-700 text-sm">• {step}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Overall Feedback */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h6 className="font-semibold text-gray-800 mb-2">Overall Feedback</h6>
                          <p className="text-gray-700 text-sm">{sessionEvaluation.sessionSummary.overallFeedback}</p>
                        </div>

                        {/* Individual Question Scores */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h6 className="font-semibold text-gray-800 mb-3">Question-by-Question Breakdown</h6>
                          <div className="space-y-3">
                            {sessionEvaluation.questionEvaluations.map((evaluation: any, index: number) => {
                              const question = interviewData?.questions.find(q => q.id === evaluation.questionId)
                              if (!question) return null
                              
                              return (
                                <div key={evaluation.questionId} className="border-l-4 border-purple-200 pl-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      Question {index + 1} ({question.category})
                                    </span>
                                    <span className={`text-sm font-bold ${
                                      evaluation.score >= 80 ? 'text-green-600' :
                                      evaluation.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {evaluation.score}/100
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">{question.question}</p>
                                  <p className="text-xs text-gray-700">{evaluation.feedback}</p>
                                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-xs font-medium text-green-700">Strengths: </span>
                                      <span className="text-xs text-green-600">{evaluation.strengths.join(', ')}</span>
                                    </div>
                                  )}
                                  {evaluation.improvements && evaluation.improvements.length > 0 && (
                                    <div className="mt-1">
                                      <span className="text-xs font-medium text-orange-700">Improvements: </span>
                                      <span className="text-xs text-orange-600">{evaluation.improvements.join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Individual Answer Evaluations */}
                    {Object.keys(answerEvaluations).length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <h4 className="text-md font-semibold text-gray-900">Individual Answer Evaluations</h4>
                        <div className="space-y-4">
                          {Object.entries(answerEvaluations).map(([questionId, evaluation]: [string, any]) => {
                            const question = interviewData?.questions.find(q => q.id === questionId)
                            if (!question) return null
                            
                            return (
                              <Card key={questionId} className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      {getCategoryIcon(question.category)}
                                      <span className="font-medium capitalize">{question.category}</span>
                                      <Badge className={getDifficultyColor(question.difficulty)}>
                                        {question.difficulty}
                                      </Badge>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      evaluation.score >= 80 
                                        ? 'bg-green-100 text-green-800'
                                        : evaluation.score >= 60
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                    }`}>
                                      {evaluation.score}/100
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <h5 className="font-medium text-gray-900 mb-1">Question:</h5>
                                    <p className="text-sm text-gray-700">{question.question}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="font-medium text-gray-900 mb-1">Your Answer:</h5>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{userAnswers[questionId]}</p>
                                  </div>
                                  
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-800">{evaluation.overallFeedback}</p>
                                  </div>
                                  
                                  {evaluation.strengths?.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-green-700 mb-1">✅ Strengths</h6>
                                      <ul className="space-y-1">
                                        {evaluation.strengths.map((strength: string, index: number) => (
                                          <li key={index} className="text-sm text-green-700">• {strength}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {evaluation.improvements?.length > 0 && (
                                    <div>
                                      <h6 className="font-medium text-orange-700 mb-1">🔧 Areas for Improvement</h6>
                                      <ul className="space-y-1">
                                        {evaluation.improvements.map((improvement: string, index: number) => (
                                          <li key={index} className="text-sm text-orange-700">• {improvement}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Saved Evaluations History */}
                    {savedEvaluations.length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <h4 className="text-md font-semibold text-gray-900">Previous Sessions</h4>
                        <div className="space-y-4">
                          {savedEvaluations.map((saved, index) => (
                            <Card key={saved.id} className="border-l-4 border-l-gray-400">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-medium text-gray-900">
                                      Session {savedEvaluations.length - index}
                                    </h5>
                                    <p className="text-sm text-gray-500">
                                      {new Date(saved.timestamp).toLocaleDateString()} at {new Date(saved.timestamp).toLocaleTimeString()}
                                    </p>
                                  </div>
                                  <div className={`text-xl font-bold ${
                                    saved.evaluation.overallScore >= 80 ? 'text-green-600' :
                                    saved.evaluation.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {saved.evaluation.overallScore}/100
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-gray-700">
                                  {saved.evaluation.sessionSummary.overallFeedback}
                                </p>
                                <div className="mt-2 text-xs text-gray-500">
                                  {saved.questionsCount} questions evaluated
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {!sessionEvaluation && Object.keys(answerEvaluations).length === 0 && savedEvaluations.length === 0 && !isLoadingEvaluations && (
                      <div className="text-center py-12">
                        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Yet</h4>
                        <p className="text-gray-600 mb-4">
                          Complete practice sessions and get individual answer feedback to see your results here.
                        </p>
                        <Button 
                          onClick={() => setActiveTab('practice')} 
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Start Practicing
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 