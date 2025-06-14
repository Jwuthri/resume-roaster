"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { Textarea } from "./textarea"
import { Input } from "./input"
import { Label } from "./label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { useAlertDialog } from "./alert-dialog"
import { AnalysisLoading } from "./analysis-loading"
import { ResumeOptimizationLoading } from "./resume-optimizer-loading"
import { 
  FileText, 
  Download, 
  Eye, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Target,
  TrendingUp,
  Code,
  Briefcase,
  Crown,
  Palette,
  Home,
  ArrowLeft,
  User,
  Save,
  Edit3,
  RefreshCw,
  BookOpen,
  Award,
  Plus,
  Minus,
  Loader2
} from "lucide-react"
import { ResumeData } from "@/lib/resume-templates"
import { generatePDF, generateDOCX, downloadBlob } from "@/lib/document-generators"
import { latexTemplates } from "@/lib/latex-templates"
import { compileLatexToPDF, downloadLatexSource } from "@/lib/latex-compiler"
import { useUserProfile } from "@/hooks/useUserProfile"

interface Template {
  id: string
  name: string
  description: string
  category: 'modern' | 'classic' | 'tech' | 'creative' | 'executive'
  atsOptimized: boolean
  type?: 'html' | 'latex'
}

interface OptimizedResumeResponse {
  resume: string
  format: 'html' | 'markdown'
  template: Template
  optimizations: {
    suggestions: string[]
    keywordsFound: string[]
    atsScore: number
  }
}

const categoryIcons = {
  modern: <Sparkles className="h-4 w-4" />,
  classic: <FileText className="h-4 w-4" />,
  tech: <Code className="h-4 w-4" />,
  creative: <Palette className="h-4 w-4" />,
  executive: <Crown className="h-4 w-4" />
}

const categoryColors = {
  modern: "bg-blue-50 border-blue-200 text-blue-700",
  classic: "bg-gray-50 border-gray-200 text-gray-700",
  tech: "bg-green-50 border-green-200 text-green-700",
  creative: "bg-purple-50 border-purple-200 text-purple-700",
  executive: "bg-amber-50 border-amber-200 text-amber-700"
}

// Sample data for template preview
const sampleResumeData: ResumeData = {
  personalInfo: {
    name: "Alex Johnson",
    email: "alex.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "https://linkedin.com/in/alexjohnson",
    portfolio: "https://alexjohnson.dev",
    github: "https://github.com/alexjohnson",
    jobTitle: "Software Engineer",
    jobDescription: "Experienced Software Engineer"
  },
  summary: "Experienced Software Engineer with 5+ years developing scalable web applications. Proven track record of leading cross-functional teams and delivering high-impact solutions that drive business growth.",
  experience: [
    {
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      startDate: "2022",
      endDate: "Present",
      description: [
        "Led development of microservices architecture serving 1M+ users",
        "Mentored junior developers and established coding best practices"
      ],
      achievements: [
        "Reduced system latency by 40% through optimization initiatives",
        "Increased team productivity by 25% through process improvements"
      ]
    }
  ],
  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      school: "University of California",
      location: "Berkeley, CA",
      graduationDate: "2019",
      gpa: "3.8",
      honors: ["Magna Cum Laude"]
    }
  ],
  skills: {
    technical: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "AWS", "Docker"],
    soft: ["Leadership", "Problem-solving", "Communication", "Team Management"],
    languages: ["English", "Spanish"],
    certifications: ["AWS Certified Solutions Architect"]
  },
  projects: [
    {
      name: "E-commerce Platform",
      description: "Built a full-stack e-commerce platform with React and Node.js",
      technologies: ["React", "Node.js", "MongoDB", "Stripe"],
      link: "https://github.com/alexjohnson/ecommerce"
    }
  ],
  publications: [],
  training: []
}

export default function ResumeOptimizerNew() {
  const { data: session } = useSession()
  const router = useRouter()
  const { showAlert, AlertDialog } = useAlertDialog()
  const { profile, loading: profileLoading, updateProfile, clearProfile } = useUserProfile()
  
  // Resume data state - initialize with empty structure
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
      github: '',
      jobTitle: '',
      jobDescription: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
      certifications: []
    },
    projects: [],
    publications: [],
    training: []
  })

  const [jobDescription, setJobDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('your-resume-style')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedResult, setOptimizedResult] = useState<OptimizedResumeResponse | null>(null)
  const [profileDataLoaded, setProfileDataLoaded] = useState(false)
  const [templatePreview, setTemplatePreview] = useState<string>('')
  const [previewTemplate, setPreviewTemplate] = useState<string>('')
  const [forceReload, setForceReload] = useState(0)

  // Check if we should force reload data (coming from download page)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('reload') === 'true') {
      setForceReload(prev => prev + 1)
      // Clean up the URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Load profile data when profile is available
  useEffect(() => {
    if (!profileLoading && profile) {
      console.log('Loading profile data:', profile)
      
      // Check for temporary form data in localStorage first
      let resumeDataToUse = profile.resumeData
      try {
        const tempFormData = localStorage.getItem('resumeFormData')
        if (tempFormData) {
          const parsedTempData = JSON.parse(tempFormData)
          console.log('Found temporary form data in localStorage:', parsedTempData)
          // Use temporary data if it exists, otherwise use profile data
          resumeDataToUse = parsedTempData
        }
      } catch (error) {
        console.error('Error parsing temporary form data:', error)
      }
      
      // Load resume data from available source with proper defaults for optional fields
      if (resumeDataToUse) {
        const loadedData = resumeDataToUse
        console.log('Loaded resume data:', loadedData)
        
        const newResumeData = {
          personalInfo: {
            name: loadedData.personalInfo?.name || '',
            email: loadedData.personalInfo?.email || '',
            phone: loadedData.personalInfo?.phone || '',
            location: loadedData.personalInfo?.location || '',
            linkedin: loadedData.personalInfo?.linkedin || '',
            portfolio: loadedData.personalInfo?.portfolio || '',
            github: loadedData.personalInfo?.github || '',
            jobTitle: loadedData.personalInfo?.jobTitle || '',
            jobDescription: loadedData.personalInfo?.jobDescription || ''
          },
          summary: loadedData.summary || '',
          experience: loadedData.experience || [],
          education: (loadedData.education || []).map((edu: any) => ({
            ...edu,
            gpa: edu.gpa || '',
            honors: edu.honors || []
          })),
          skills: {
            technical: loadedData.skills?.technical || [],
            soft: loadedData.skills?.soft || [],
            languages: loadedData.skills?.languages || [],
            certifications: loadedData.skills?.certifications || []
          },
          projects: loadedData.projects || [],
          publications: loadedData.publications || [],
          training: loadedData.training || []
        }
        
        console.log('Setting resume data:', newResumeData)
        setResumeData(newResumeData)
      } else {
        console.log('No resume data found in profile or localStorage')
      }
      
      // Load current job description
      if (profile.currentJobDescription) {
        setJobDescription(profile.currentJobDescription)
      }
      
      setProfileDataLoaded(true)
    } else if (!profileLoading && !profile) {
      console.log('No profile available, setting data loaded to true')
      setProfileDataLoaded(true)
    }
  }, [profile, profileLoading, forceReload])

  // Save resume data to profile whenever it changes
  useEffect(() => {
    if (profileDataLoaded && session?.user?.email) {
      const saveData = async () => {
        try {
          await updateProfile({
            resumeData: resumeData
          })
        } catch (error) {
          console.error('Failed to save resume data:', error)
        }
      }
      
      // Debounce the save operation
      const timeoutId = setTimeout(saveData, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [resumeData, profileDataLoaded, session?.user?.email, updateProfile])

  // Save job description separately (don't auto-save this)
  const saveJobDescription = async () => {
    if (session?.user?.email) {
      try {
        await updateProfile({
          currentJobDescription: jobDescription
        })
      } catch (error) {
        console.error('Failed to save job description:', error)
      }
    }
  }

  // Function to clear profile data
  const clearProfileData = async () => {
    try {
      await clearProfile()
      // Also clear localStorage
      localStorage.removeItem('resumeFormData')
      
      setResumeData({
        personalInfo: {
          name: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          portfolio: '',
          github: '',
          jobTitle: '',
          jobDescription: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: {
          technical: [],
          soft: [],
          languages: [],
          certifications: []
        },
        projects: [],
        publications: [],
        training: []
      })
      setJobDescription('')
      setProfileDataLoaded(false)
    } catch (error) {
      console.error('Failed to clear profile:', error)
    }
  }

  // Function to update personal info
  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }))
  }

  // Function to update summary
  const updateSummary = (value: string) => {
    setResumeData(prev => ({
      ...prev,
      summary: value
    }))
  }

  // Function to add experience
  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: [],
          achievements: []
        }
      ]
    }))
  }

  // Function to update experience
  const updateExperience = (index: number, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }))
  }

  // Function to remove experience
  const removeExperience = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }))
  }

  // Function to add education
  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: '',
          school: '',
          location: '',
          graduationDate: '',
          gpa: '',
          honors: []
        }
      ]
    }))
  }

  // Function to update education
  const updateEducation = (index: number, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }))
  }

  // Function to remove education
  const removeEducation = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }))
  }

  // Function to update skills
  const updateSkills = (category: keyof ResumeData['skills'], skills: string[]) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: skills
      }
    }))
  }

  // Function to add project
  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        {
          name: '',
          description: '',
          technologies: [],
          link: ''
        }
      ]
    }))
  }

  // Function to update project
  const updateProject = (index: number, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: (prev.projects || []).map((proj, i) => 
        i === index ? { ...proj, [field]: value } : proj
      )
    }))
  }

  // Function to remove project
  const removeProject = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index)
    }))
  }

  // Function to add publication
  const addPublication = () => {
    setResumeData(prev => ({
      ...prev,
      publications: [
        ...(prev.publications || []),
        {
          title: '',
          authors: '',
          journal: '',
          conference: '',
          year: '',
          doi: '',
          link: ''
        }
      ]
    }))
  }

  // Function to update publication
  const updatePublication = (index: number, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      publications: (prev.publications || []).map((pub, i) => 
        i === index ? { ...pub, [field]: value } : pub
      )
    }))
  }

  // Function to remove publication
  const removePublication = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      publications: (prev.publications || []).filter((_, i) => i !== index)
    }))
  }

  // Function to add training
  const addTraining = () => {
    setResumeData(prev => ({
      ...prev,
      training: [
        ...(prev.training || []),
        {
          name: '',
          provider: '',
          completionDate: '',
          expirationDate: '',
          credentialId: '',
          link: ''
        }
      ]
    }))
  }

  // Function to update training
  const updateTraining = (index: number, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      training: (prev.training || []).map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }))
  }

  // Function to remove training
  const removeTraining = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      training: (prev.training || []).filter((_, i) => i !== index)
    }))
  }

  // Auto-generate preview when template is selected
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== previewTemplate) {
      generateTemplatePreview(selectedTemplate)
    }
  }, [selectedTemplate])

  const generateTemplatePreview = async (templateId: string) => {
    try {
      const response = await fetch('/api/generate-optimized-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: sampleResumeData,
          jobDescription: 'Sample job description for preview',
          templateId: templateId,
          format: 'html',
          isPreview: true
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setTemplatePreview(result.data.resume)
          setPreviewTemplate(templateId)
        }
      }
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  // Function to generate resume with template
  const handleGenerateWithTemplate = async () => {
    if (!resumeData.personalInfo.name || !resumeData.personalInfo.email) {
      showAlert({
        title: "Missing Information",
        description: "Please fill in at least your name and email.",
        type: "warning",
        confirmText: "OK"
      })
      return
    }

    if (!selectedTemplate) {
      showAlert({
        title: "No Template Selected",
        description: "Please select a template for your resume.",
        type: "warning",
        confirmText: "OK"
      })
      return
    }

    setIsOptimizing(true)
    
    try {
      console.log('Generating resume with template:', selectedTemplate)
      
      const templateResponse = await fetch('/api/generate-optimized-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData: resumeData,
          templateId: selectedTemplate,
          format: 'html',
          skipOptimization: true,
          isPreview: false
        }),
      })

      if (!templateResponse.ok) {
        throw new Error('Failed to generate resume with template')
      }

      const templateResult = await templateResponse.json()
      if (!templateResult.success) {
        throw new Error(templateResult.error || 'Failed to generate resume with template')
      }

      // Transform the result to match the expected OptimizedResumeResponse format
      const transformedResult: OptimizedResumeResponse = {
        resume: templateResult.data.resume,
        format: 'html' as const,
        template: {
          id: selectedTemplate,
          name: 'Resume Template',
          description: 'Generated resume template',
          category: 'modern' as const,
          atsOptimized: false
        },
        optimizations: {
          suggestions: [],
          keywordsFound: [],
          atsScore: 0
        }
      }

      // Save the optimized resume to database
      try {
        const saveResponse = await fetch('/api/optimized-resume', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: transformedResult.resume,
            data: resumeData,
            templateId: selectedTemplate,
            roastId: profile?.currentRoastId || null,
            atsScore: transformedResult.optimizations.atsScore,
            keywordsMatched: transformedResult.optimizations.keywordsFound
          }),
        })

        if (!saveResponse.ok) {
          console.warn('Failed to save optimized resume to database, falling back to sessionStorage')
          // Fallback to sessionStorage if database save fails
          sessionStorage.setItem('optimizedResumeResult', JSON.stringify(transformedResult))
          sessionStorage.setItem('resumeDataForDownload', JSON.stringify(resumeData))
        } else {
          console.log('Optimized resume saved to database successfully')
          // Clear any old sessionStorage data
          sessionStorage.removeItem('optimizedResumeResult')
          sessionStorage.removeItem('resumeDataForDownload')
        }
      } catch (error) {
        console.warn('Error saving optimized resume to database:', error)
        // Fallback to sessionStorage
        sessionStorage.setItem('optimizedResumeResult', JSON.stringify(transformedResult))
        sessionStorage.setItem('resumeDataForDownload', JSON.stringify(resumeData))
      }

      // Update profile with navigation info
      await updateProfile({
        lastPage: '/download'
      })
      
      console.log('Resume generation completed successfully, redirecting to download page')
      router.push('/download')

    } catch (error) {
      console.error('Error generating resume:', error)
      showAlert({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate resume. Please try again.",
        type: "error",
        confirmText: "OK"
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Resume Optimizer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create and optimize your resume with AI-powered suggestions
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="personal" className="space-y-6">
            <div className="flex justify-center">
              <TabsList className="grid w-full max-w-4xl grid-cols-6">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="publications">Publications</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
                <TabsTrigger value="generate">Generate</TabsTrigger>
              </TabsList>
            </div>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Enter your basic contact information and professional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={resumeData.personalInfo.name || ''}
                        onChange={(e) => updatePersonalInfo('name', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={resumeData.personalInfo.email || ''}
                        onChange={(e) => updatePersonalInfo('email', e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={resumeData.personalInfo.phone || ''}
                        onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={resumeData.personalInfo.location || ''}
                        onChange={(e) => updatePersonalInfo('location', e.target.value)}
                        placeholder="City, State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={resumeData.personalInfo.linkedin || ''}
                        onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/in/johndoe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="portfolio">Portfolio</Label>
                      <Input
                        id="portfolio"
                        value={resumeData.personalInfo.portfolio || ''}
                        onChange={(e) => updatePersonalInfo('portfolio', e.target.value)}
                        placeholder="https://johndoe.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={resumeData.summary || ''}
                      onChange={(e) => updateSummary(e.target.value)}
                      placeholder="Brief overview of your professional background and key achievements..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Briefcase className="h-5 w-5 mr-2" />
                      Work Experience
                    </div>
                    <Button onClick={addExperience} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {resumeData.experience.map((exp, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Experience {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExperience(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Job Title</Label>
                          <Input
                            value={exp.title || ''}
                            onChange={(e) => updateExperience(index, 'title', e.target.value)}
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={exp.company || ''}
                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                            placeholder="Tech Company Inc."
                          />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            value={exp.startDate || ''}
                            onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            value={exp.endDate || ''}
                            onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                            placeholder="MM/YYYY or Present"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={(exp.description || []).join('\n')}
                          onChange={(e) => updateExperience(index, 'description', e.target.value.split('\n').filter(line => line.trim()))}
                          placeholder="• Describe your responsibilities and duties..."
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label>Achievements</Label>
                        <Textarea
                          value={(exp.achievements || []).join('\n')}
                          onChange={(e) => updateExperience(index, 'achievements', e.target.value.split('\n').filter(line => line.trim()))}
                          placeholder="• Quantified achievements and impact..."
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {resumeData.experience.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No work experience added yet.</p>
                      <p className="text-sm">Click "Add Experience" to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Education Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Education
                    </div>
                    <Button onClick={addEducation} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {resumeData.education.map((edu, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Education {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Degree</Label>
                          <Input
                            value={edu.degree || ''}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            placeholder="Bachelor of Science"
                          />
                        </div>
                        <div>
                          <Label>School</Label>
                          <Input
                            value={edu.school || ''}
                            onChange={(e) => updateEducation(index, 'school', e.target.value)}
                            placeholder="University Name"
                          />
                        </div>
                        <div>
                          <Label>Graduation Date</Label>
                          <Input
                            value={edu.graduationDate || ''}
                            onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <Label>GPA (Optional)</Label>
                          <Input
                            value={edu.gpa || ''}
                            onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                            placeholder="3.8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {resumeData.education.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No education added yet.</p>
                      <p className="text-sm">Click "Add Education" to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Skills & Expertise
                  </CardTitle>
                  <CardDescription>
                    Add your technical skills, soft skills, and other competencies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Technical Skills</Label>
                    <Textarea
                      value={(resumeData.skills.technical || []).join(', ')}
                      onChange={(e) => updateSkills('technical', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="JavaScript, Python, React, Node.js, AWS..."
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
                  </div>
                  
                  <div>
                    <Label>Soft Skills</Label>
                    <Textarea
                      value={(resumeData.skills.soft || []).join(', ')}
                      onChange={(e) => updateSkills('soft', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="Leadership, Communication, Problem-solving, Team Management..."
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">Separate skills with commas</p>
                  </div>
                  
                  <div>
                    <Label>Languages</Label>
                    <Textarea
                      value={(resumeData.skills.languages || []).join(', ')}
                      onChange={(e) => updateSkills('languages', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="English (Native), Spanish (Fluent), French (Conversational)..."
                      rows={2}
                    />
                    <p className="text-sm text-gray-500 mt-1">Separate languages with commas</p>
                  </div>
                  
                  <div>
                    <Label>Certifications</Label>
                    <Textarea
                      value={(resumeData.skills.certifications || []).join(', ')}
                      onChange={(e) => updateSkills('certifications', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="AWS Certified Solutions Architect, PMP, Scrum Master..."
                      rows={2}
                    />
                    <p className="text-sm text-gray-500 mt-1">Separate certifications with commas</p>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Projects
                    </div>
                    <Button onClick={addProject} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Project
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {resumeData.projects?.map((project, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Project {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Project Name</Label>
                          <Input
                            value={project.name || ''}
                            onChange={(e) => updateProject(index, 'name', e.target.value)}
                            placeholder="E-commerce Platform"
                          />
                        </div>
                        <div>
                          <Label>Project Link</Label>
                          <Input
                            value={project.link || ''}
                            onChange={(e) => updateProject(index, 'link', e.target.value)}
                            placeholder="https://github.com/username/project"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={project.description || ''}
                          onChange={(e) => updateProject(index, 'description', e.target.value)}
                          placeholder="Brief description of the project and your role..."
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label>Technologies Used</Label>
                        <Textarea
                          value={(project.technologies || []).join(', ')}
                          onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                          placeholder="React, Node.js, MongoDB, AWS..."
                          rows={2}
                        />
                        <p className="text-sm text-gray-500 mt-1">Separate technologies with commas</p>
                      </div>
                    </div>
                  ))}
                  
                  {(!resumeData.projects || resumeData.projects.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No projects added yet.</p>
                      <p className="text-sm">Click "Add Project" to showcase your work.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Publications Tab */}
            <TabsContent value="publications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Publications
                    </div>
                    <Button onClick={addPublication} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Publication
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Add your research papers, articles, and other publications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {resumeData.publications?.map((pub, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Publication {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePublication(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label>Title</Label>
                          <Input
                            value={pub.title || ''}
                            onChange={(e) => updatePublication(index, 'title', e.target.value)}
                            placeholder="Research Paper Title"
                          />
                        </div>
                        <div>
                          <Label>Authors</Label>
                          <Input
                            value={pub.authors || ''}
                            onChange={(e) => updatePublication(index, 'authors', e.target.value)}
                            placeholder="Author 1, Author 2, Author 3"
                          />
                        </div>
                        <div>
                          <Label>Year</Label>
                          <Input
                            value={pub.year || ''}
                            onChange={(e) => updatePublication(index, 'year', e.target.value)}
                            placeholder="2023"
                          />
                        </div>
                        <div>
                          <Label>Journal</Label>
                          <Input
                            value={pub.journal || ''}
                            onChange={(e) => updatePublication(index, 'journal', e.target.value)}
                            placeholder="Journal Name"
                          />
                        </div>
                        <div>
                          <Label>Conference</Label>
                          <Input
                            value={pub.conference || ''}
                            onChange={(e) => updatePublication(index, 'conference', e.target.value)}
                            placeholder="Conference Name"
                          />
                        </div>
                        <div>
                          <Label>DOI</Label>
                          <Input
                            value={pub.doi || ''}
                            onChange={(e) => updatePublication(index, 'doi', e.target.value)}
                            placeholder="10.1000/182"
                          />
                        </div>
                        <div>
                          <Label>Link</Label>
                          <Input
                            value={pub.link || ''}
                            onChange={(e) => updatePublication(index, 'link', e.target.value)}
                            placeholder="https://example.com/paper"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!resumeData.publications || resumeData.publications.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No publications added yet.</p>
                      <p className="text-sm">Click "Add Publication" to showcase your research.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Training Tab */}
            <TabsContent value="training" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Training & Certifications
                    </div>
                    <Button onClick={addTraining} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Training
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Add your professional training, courses, and certifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {resumeData.training?.map((training, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">Training {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTraining(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Training/Course Name</Label>
                          <Input
                            value={training.name || ''}
                            onChange={(e) => updateTraining(index, 'name', e.target.value)}
                            placeholder="AWS Solutions Architect"
                          />
                        </div>
                        <div>
                          <Label>Provider</Label>
                          <Input
                            value={training.provider || ''}
                            onChange={(e) => updateTraining(index, 'provider', e.target.value)}
                            placeholder="Amazon Web Services"
                          />
                        </div>
                        <div>
                          <Label>Completion Date</Label>
                          <Input
                            value={training.completionDate || ''}
                            onChange={(e) => updateTraining(index, 'completionDate', e.target.value)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <Label>Expiration Date (Optional)</Label>
                          <Input
                            value={training.expirationDate || ''}
                            onChange={(e) => updateTraining(index, 'expirationDate', e.target.value)}
                            placeholder="MM/YYYY"
                          />
                        </div>
                        <div>
                          <Label>Credential ID (Optional)</Label>
                          <Input
                            value={training.credentialId || ''}
                            onChange={(e) => updateTraining(index, 'credentialId', e.target.value)}
                            placeholder="ABC123456"
                          />
                        </div>
                        <div>
                          <Label>Verification Link (Optional)</Label>
                          <Input
                            value={training.link || ''}
                            onChange={(e) => updateTraining(index, 'link', e.target.value)}
                            placeholder="https://verify.example.com"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!resumeData.training || resumeData.training.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No training or certifications added yet.</p>
                      <p className="text-sm">Click "Add Training" to showcase your professional development.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Generate Your Resume
                  </CardTitle>
                  <CardDescription>
                    Choose a template and generate your professional resume
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template Selection */}
                  <div>
                    <Label className="text-base font-medium">Choose Template</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {[
                        { id: 'your-resume-style', name: 'Classic', category: 'classic' as const },
                        { id: 'modern-template', name: 'Modern', category: 'modern' as const },
                        { id: 'modern-tech', name: 'Tech', category: 'tech' as const }
                      ].map((template) => (
                        <div
                          key={template.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedTemplate === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge className={categoryColors[template.category]}>
                              {categoryIcons[template.category]}
                              <span className="ml-1">{template.category}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Professional {template.category} template
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Job Description */}
                  <div>
                    <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                    <Textarea
                      id="jobDescription"
                      value={jobDescription || ''}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here for AI optimization..."
                      rows={6}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Adding a job description will help optimize your resume for the specific role
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleGenerateWithTemplate}
                      disabled={isOptimizing}
                      className="flex-1"
                      size="lg"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5 mr-2" />
                          Generate Resume
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={clearProfileData}
                      size="lg"
                    >
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Loading Overlay */}
      {isOptimizing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ResumeOptimizationLoading />
        </div>
      )}

      {AlertDialog}
    </div>
  )
} 