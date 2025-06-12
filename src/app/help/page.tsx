"use client"

import { useState } from "react"
import { Flame, Search, ChevronDown, ChevronRight, ArrowLeft, HelpCircle, FileText, Zap, Target, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Footer } from "@/components/ui/footer"
import { Navigation } from "@/components/ui/navigation"

interface FAQItem {
  question: string
  answer: string
  category: string
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  const faqData: FAQItem[] = [
    {
      category: "Getting Started",
      question: "How do I upload my resume?",
      answer: "Simply click the 'Upload Resume' button on the homepage and select your PDF file. Our AI will automatically extract and analyze your resume content."
    },
    {
      category: "Getting Started", 
      question: "What file formats are supported?",
      answer: "Currently, we support PDF files only. Make sure your resume is saved as a PDF for the best results."
    },
    {
      category: "Getting Started",
      question: "How long does the analysis take?",
      answer: "Most resume analyses are completed within 30-60 seconds. Complex resumes may take up to 2 minutes."
    },
    {
      category: "Account & Billing",
      question: "How many free roasts do I get?",
      answer: "New users get 10 free resume roasts. After that, you can upgrade to our Pro plan for unlimited roasts and premium features."
    },
    {
      category: "Account & Billing",
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
    },
    {
      category: "Features",
      question: "What is ATS optimization?",
      answer: "ATS (Applicant Tracking System) optimization ensures your resume can be properly read by automated systems that many companies use to screen resumes."
    },
    {
      category: "Features",
      question: "How accurate is the AI analysis?",
      answer: "Our AI is trained on thousands of successful resumes and hiring patterns. While highly accurate, we recommend using the feedback as guidance alongside your own judgment."
    },
    {
      category: "Features",
      question: "Can I download my optimized resume?",
      answer: "Yes, Pro users can download their optimized resumes in multiple formats including PDF, Word, and HTML."
    },
    {
      category: "Troubleshooting",
      question: "My resume upload failed. What should I do?",
      answer: "Try refreshing the page and uploading again. If the issue persists, make sure your PDF is under 10MB and not password-protected."
    },
    {
      category: "Troubleshooting",
      question: "The analysis seems incomplete or wrong.",
      answer: "Our AI works best with standard resume formats. If you're using a very creative or non-standard layout, try a more traditional format."
    },
    {
      category: "Troubleshooting",
      question: "I can't access my account.",
      answer: "Try resetting your password using the 'Forgot Password' link on the sign-in page. If that doesn't work, contact our support team."
    }
  ]

  const categories = Array.from(new Set(faqData.map(item => item.category)))

  const filteredFAQs = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const guides = [
    {
      title: "Writing an Effective Resume",
      description: "Learn the fundamentals of creating a resume that stands out to employers.",
      icon: <FileText className="h-6 w-6 text-blue-500" />
    },
    {
      title: "ATS Optimization Guide",
      description: "Make sure your resume passes through applicant tracking systems.",
      icon: <Target className="h-6 w-6 text-green-500" />
    },
    {
      title: "Using Resume Roaster",
      description: "Get the most out of our AI-powered resume analysis platform.",
      icon: <Zap className="h-6 w-6 text-orange-500" />
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* Navigation */}
      <Navigation currentPage="help" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions and learn how to get the most out of Resume Roaster.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Guides */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Helpful Guides</CardTitle>
                <CardDescription>
                  Step-by-step tutorials and best practices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {guides.map((guide, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    {guide.icon}
                    <div>
                      <h4 className="font-medium text-sm">{guide.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{guide.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-800">Still Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Link href="/contact">
                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  {searchQuery ? `Search results for "${searchQuery}"` : 'Common questions and answers'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories.map(category => {
                  const categoryFAQs = filteredFAQs.filter(item => item.category === category)
                  
                  if (categoryFAQs.length === 0) return null

                  return (
                    <div key={category} className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <HelpCircle className="h-5 w-5 text-orange-500 mr-2" />
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {categoryFAQs.map((faq, index) => {
                          const globalIndex = faqData.indexOf(faq)
                          const isOpen = openItems[globalIndex]
                          
                          return (
                            <div key={globalIndex} className="border border-gray-200 rounded-lg">
                              <button
                                onClick={() => toggleItem(globalIndex)}
                                className="flex items-center justify-between w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <span className="font-medium">{faq.question}</span>
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4">
                                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {filteredFAQs.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600 mb-4">
                      We couldn't find any help articles matching "{searchQuery}".
                    </p>
                    <Link href="/contact">
                      <Button variant="outline">
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
} 