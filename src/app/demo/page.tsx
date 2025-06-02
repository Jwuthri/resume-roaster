"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/ui/navigation"
import { 
  FileText, 
  Download, 
  Eye, 
  ArrowLeft,
  Code,
  Palette,
  Crown,
  Sparkles
} from "lucide-react"
import { yourResumeTemplate } from "@/lib/resume-templates"
import { sampleResumeData } from "@/lib/sample-resume-data"
import { generatePDF, generateDOCX, downloadBlob } from "@/lib/document-generators"
import Link from "next/link"

export default function DemoPage() {
  const [activeView, setActiveView] = useState<'html' | 'markdown'>('html')

  const generateHTML = () => {
    return yourResumeTemplate.generateHTML(sampleResumeData)
  }

  const generateMarkdown = () => {
    return yourResumeTemplate.generateMarkdown(sampleResumeData)
  }

  const downloadHTML = () => {
    const html = generateHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'alex-johnson-resume.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadMarkdown = () => {
    const markdown = generateMarkdown()
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'alex-johnson-resume.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadPDF = async () => {
    try {
      const pdfBlob = await generatePDF(sampleResumeData, generateHTML())
      downloadBlob(pdfBlob, 'alex-johnson-resume.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const downloadDOCX = async () => {
    try {
      const docxBlob = await generateDOCX(sampleResumeData)
      downloadBlob(docxBlob, 'alex-johnson-resume.docx')
    } catch (error) {
      console.error('Error generating DOCX:', error)
      alert('Failed to generate DOCX. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Navigation */}
      <Navigation currentPage="demo" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Resume Template Demo
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Classic Resume Style - Clean, Professional, ATS-Optimized
            </p>
            
            <div className="flex justify-center items-center gap-4 mb-8">
              <Badge variant="secondary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Classic Style
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                ATS Optimized
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Professional
              </Badge>
            </div>
          </div>
        </div>

        {/* Template Preview and Code */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how the resume template looks with sample data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg overflow-hidden shadow-lg">
                  <div 
                    className="w-full overflow-hidden"
                    style={{ 
                      height: '800px',
                      background: 'white'
                    }}
                  >
                    <iframe
                      srcDoc={generateHTML()}
                      className="w-full h-full border-0"
                      style={{
                        transform: 'scale(0.8)',
                        transformOrigin: 'top left',
                        width: '125%',
                        height: '125%'
                      }}
                      title="Resume Template Preview"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button onClick={downloadHTML} className="flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    HTML
                  </Button>
                  <Button onClick={downloadMarkdown} variant="outline" className="flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Markdown
                  </Button>
                  <Button onClick={downloadPDF} variant="outline" className="flex items-center justify-center border-green-200 text-green-600 hover:bg-green-50">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button onClick={downloadDOCX} variant="outline" className="flex items-center justify-center border-yellow-200 text-yellow-600 hover:bg-yellow-50">
                    <Download className="h-4 w-4 mr-2" />
                    DOCX
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Template Features */}
            <Card>
              <CardHeader>
                <CardTitle>Template Features</CardTitle>
                <CardDescription>
                  What makes this template special
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-sm">ATS Optimized</h4>
                      <p className="text-xs text-gray-600">Passes through applicant tracking systems</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Clean Typography</h4>
                      <p className="text-xs text-gray-600">Professional Times New Roman font</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Structured Layout</h4>
                      <p className="text-xs text-gray-600">Clear sections and hierarchy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-semibold text-sm">Print Ready</h4>
                      <p className="text-xs text-gray-600">Optimized for printing and PDF export</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Template Code
                </CardTitle>
                <CardDescription>
                  View the HTML and Markdown output
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'html' | 'markdown')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="html" className="mt-4">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                      <pre className="whitespace-pre-wrap">
                        <code>{generateHTML()}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="markdown" className="mt-4">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                      <pre className="whitespace-pre-wrap">
                        <code>{generateMarkdown()}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Sample Data */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Data Structure</CardTitle>
                <CardDescription>
                  The data structure used to generate this resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                  <pre className="whitespace-pre-wrap">
                    <code>{JSON.stringify(sampleResumeData, null, 2)}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4">Ready to Create Your Resume?</h3>
              <p className="text-gray-600 mb-6">
                Use our AI-powered resume optimizer to create a professional resume with this template and many others.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/resume-optimizer">
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create Your Resume
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 