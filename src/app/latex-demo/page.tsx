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
import { latexTemplates } from "@/lib/latex-templates"
import { sampleResumeData } from "@/lib/sample-resume-data"
import { downloadLatexSource, compileLatexToPDF } from "@/lib/latex-compiler"
import { downloadBlob } from "@/lib/document-generators"
import Link from "next/link"

export default function LaTeXDemoPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(latexTemplates[0]?.id || '')
  const [activeView, setActiveView] = useState<'source' | 'preview'>('source')

  const getCurrentTemplate = () => {
    return latexTemplates.find(t => t.id === selectedTemplate) || latexTemplates[0]
  }

  const generateLatexSource = () => {
    const template = getCurrentTemplate()
    return template.generateLaTeX(sampleResumeData)
  }

  const downloadSource = () => {
    try {
      downloadLatexSource(selectedTemplate, sampleResumeData)
    } catch (error) {
      console.error('Error downloading LaTeX source:', error)
      alert('Failed to download LaTeX source. Please try again.')
    }
  }

  const downloadPDF = async () => {
    try {
      const result = await compileLatexToPDF(selectedTemplate, sampleResumeData)
      
      if (result.success && result.pdfBuffer) {
        const blob = new Blob([result.pdfBuffer], { type: 'application/pdf' })
        downloadBlob(blob, 'alex-johnson-resume-latex.pdf')
      } else {
        alert(`PDF compilation failed: ${result.error || 'Unknown error'}. You can download the LaTeX source and compile it manually.`)
      }
    } catch (error) {
      console.error('Error compiling LaTeX to PDF:', error)
      alert('Failed to compile LaTeX to PDF. You can download the LaTeX source and compile it manually.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Navigation */}
      <Navigation currentPage="demo" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              LaTeX Resume Templates Demo
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Professional LaTeX templates from Overleaf - Publication-quality typesetting
            </p>
            
            <div className="flex justify-center items-center gap-4 mb-8">
              <Badge variant="secondary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                LaTeX Powered
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Professional Quality
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Publication Ready
              </Badge>
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Choose a LaTeX Template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latexTemplates.map((template) => (
              <Card 
                key={template.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                  selectedTemplate === template.id 
                    ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg' 
                    : 'hover:bg-gradient-to-br hover:from-gray-50 hover:to-purple-50'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Code className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold">{template.name}</h3>
                    </div>
                    <div className="flex flex-col space-y-1">
                      {template.atsOptimized && (
                        <Badge variant="secondary" className="text-xs">
                          ATS
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">
                        LaTeX
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {template.description}
                  </p>
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-purple-50 border-purple-200 text-purple-700"
                  >
                    {template.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Template Preview and Code */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Code Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  {getCurrentTemplate().name} - LaTeX Source
                </CardTitle>
                <CardDescription>
                  Professional LaTeX template with sample data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'source' | 'preview')}>
                  <div className="flex justify-between items-center mb-4">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="source">LaTeX Source</TabsTrigger>
                      <TabsTrigger value="preview">Preview Info</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex gap-2">
                      <Button onClick={downloadSource} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download .tex
                      </Button>
                      <Button onClick={downloadPDF} className="bg-purple-600 hover:bg-purple-700">
                        <Download className="h-4 w-4 mr-2" />
                        Compile PDF
                      </Button>
                    </div>
                  </div>
                  
                  <TabsContent value="source" className="mt-4">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                      <pre className="whitespace-pre-wrap">
                        <code>{generateLatexSource()}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="preview" className="mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4 text-blue-900">About LaTeX Templates</h3>
                      <div className="space-y-4 text-blue-800">
                        <div>
                          <h4 className="font-medium">Professional Typesetting</h4>
                          <p className="text-sm">LaTeX produces publication-quality documents with superior typography, mathematical formulas, and consistent formatting.</p>
                        </div>
                        <div>
                          <h4 className="font-medium">How to Use</h4>
                          <ol className="text-sm list-decimal list-inside space-y-1">
                            <li>Download the .tex source file</li>
                            <li>Open in Overleaf, TeXShop, or any LaTeX editor</li>
                            <li>Compile with pdflatex or xelatex</li>
                            <li>Get a professional PDF resume</li>
                          </ol>
                        </div>
                        <div>
                          <h4 className="font-medium">Template Features</h4>
                          <ul className="text-sm list-disc list-inside space-y-1">
                            <li>Based on popular Overleaf templates</li>
                            <li>ATS-compatible when compiled to PDF</li>
                            <li>Professional fonts and spacing</li>
                            <li>Easy to customize and modify</li>
                          </ul>
                        </div>
                      </div>
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
                  The data structure used to generate this LaTeX resume
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
              <h3 className="text-2xl font-bold mb-4">Ready to Create Your LaTeX Resume?</h3>
              <p className="text-gray-600 mb-6">
                Use our AI-powered resume optimizer to create professional LaTeX resumes with these templates and many others.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/resume-optimizer">
                  <Button size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create Your LaTeX Resume
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline">
                    <Eye className="h-5 w-5 mr-2" />
                    View HTML Templates
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