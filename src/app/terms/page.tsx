"use client"

import { Flame, ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle, XCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Footer } from "@/components/ui/footer"
import { Navigation } from "@/components/ui/navigation"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* Navigation */}
      <Navigation currentPage="terms" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Scale className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Please read these terms carefully before using Resume Roaster. By using our service, you agree to these terms.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: January 2025</p>
        </div>

        <div className="space-y-8">
          {/* Acceptance of Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Acceptance of Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                By accessing and using Resume Roaster ("the Service"), you accept and agree to be bound by the 
                terms and provision of this agreement. If you do not agree to abide by the above, please do not 
                use this service.
              </p>
              <p>
                These Terms of Service ("Terms") govern your use of our website and services operated by 
                Resume Roaster ("us", "we", or "our").
              </p>
            </CardContent>
          </Card>

          {/* Description of Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span>Description of Service</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Resume Roaster is an AI-powered resume analysis and optimization platform that provides:
                </p>
                
                <ul className="space-y-2 text-gray-600">
                  <li>• Automated resume analysis and feedback</li>
                  <li>• AI-generated suggestions for improvement</li>
                  <li>• ATS (Applicant Tracking System) optimization</li>
                  <li>• Resume formatting and template services</li>
                  <li>• Career guidance and recommendations</li>
                </ul>

                <p className="text-gray-600">
                  The Service is provided "as is" and we reserve the right to modify, suspend, or discontinue 
                  any part of the Service at any time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  To access certain features of the Service, you must register for an account. When you register:
                </p>
                
                <ul className="space-y-2 text-gray-600">
                  <li>• You must provide accurate, current, and complete information</li>
                  <li>• You must maintain and update your information to keep it accurate</li>
                  <li>• You are responsible for maintaining the confidentiality of your password</li>
                  <li>• You are responsible for all activities that occur under your account</li>
                  <li>• You must notify us immediately of any unauthorized use of your account</li>
                </ul>

                <p className="text-gray-600">
                  You must be at least 18 years old to create an account and use our Service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Acceptable Use Policy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
                
                <ul className="space-y-2 text-gray-600">
                  <li>• Upload false, misleading, or fraudulent information</li>
                  <li>• Violate any applicable laws or regulations</li>
                  <li>• Infringe on intellectual property rights of others</li>
                  <li>• Transmit viruses, malware, or other harmful code</li>
                  <li>• Attempt to gain unauthorized access to our systems</li>
                  <li>• Use the Service to spam or send unsolicited communications</li>
                  <li>• Reverse engineer or attempt to extract our algorithms</li>
                  <li>• Use automated tools to access the Service without permission</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Content and Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>Content and Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Content</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• You retain ownership of your resume content and personal information</li>
                    <li>• You grant us a license to use your content to provide our services</li>
                    <li>• You represent that you have the right to upload and use your content</li>
                    <li>• You are responsible for the accuracy and legality of your content</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Content</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• All Service content, features, and functionality are owned by Resume Roaster</li>
                    <li>• Our content is protected by copyright, trademark, and other laws</li>
                    <li>• You may not copy, modify, or distribute our content without permission</li>
                    <li>• AI-generated suggestions and feedback are provided for your personal use only</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Terms and Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Free and Paid Services</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• We offer both free and paid subscription plans</li>
                    <li>• Free accounts have limited features and usage quotas</li>
                    <li>• Paid subscriptions provide additional features and higher usage limits</li>
                    <li>• Subscription fees are billed in advance on a recurring basis</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing and Cancellation</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• All fees are non-refundable except as required by law</li>
                    <li>• You can cancel your subscription at any time from your account settings</li>
                    <li>• Cancellation takes effect at the end of your current billing period</li>
                    <li>• We may change our pricing with 30 days' notice</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimers and Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Disclaimers and Limitations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Disclaimers</h3>
                  <ul className="space-y-2 text-yellow-700 text-sm">
                    <li>• Our AI analysis is for guidance only and not a guarantee of job placement</li>
                    <li>• Resume suggestions should be reviewed and customized for your specific situation</li>
                    <li>• We do not guarantee that our service will meet your specific requirements</li>
                    <li>• The Service is provided "as is" without warranties of any kind</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
                  <p className="text-gray-600">
                    To the maximum extent permitted by law, Resume Roaster shall not be liable for any indirect, 
                    incidental, special, consequential, or punitive damages, including without limitation, loss of 
                    profits, data, use, goodwill, or other intangible losses.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Your privacy is important to us. Our collection and use of personal information is governed by 
                  our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                
                <ul className="space-y-2 text-gray-600">
                  <li>• We collect and process your data as described in our Privacy Policy</li>
                  <li>• You consent to our data practices by using the Service</li>
                  <li>• We implement security measures to protect your information</li>
                  <li>• You can request deletion of your data as outlined in our Privacy Policy</li>
                </ul>

                <div className="mt-4">
                  <Link href="/privacy">
                    <Button variant="outline" size="sm">
                      Read Privacy Policy
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span>Termination</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  We may terminate or suspend your account and access to the Service immediately, without prior 
                  notice or liability, for any reason, including if you breach these Terms.
                </p>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Grounds for Termination</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Violation of these Terms of Service</li>
                    <li>• Fraudulent or illegal activity</li>
                    <li>• Abuse of the Service or other users</li>
                    <li>• Non-payment of fees (for paid accounts)</li>
                    <li>• Inactivity for extended periods</li>
                  </ul>
                </div>

                <p className="text-gray-600">
                  Upon termination, your right to use the Service will cease immediately. We may delete your 
                  account and data, though some information may be retained as required by law.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>Governing Law and Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  These Terms shall be governed by and construed in accordance with the laws of the State of 
                  California, United States, without regard to its conflict of law provisions.
                </p>
                
                <p className="text-gray-600">
                  Any disputes arising from these Terms or your use of the Service shall be resolved through 
                  binding arbitration in accordance with the rules of the American Arbitration Association.
                </p>

                <p className="text-gray-600">
                  If any provision of these Terms is found to be unenforceable, the remaining provisions will 
                  remain in full force and effect.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                  we will provide at least 30 days' notice prior to any new terms taking effect.
                </p>
                
                <p className="text-gray-600">
                  What constitutes a material change will be determined at our sole discretion. By continuing to 
                  access or use our Service after any revisions become effective, you agree to be bound by the 
                  revised terms.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <Mail className="h-5 w-5" />
                <span>Contact Us</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              
              <div className="space-y-2 text-orange-700">
                <p><strong>Email:</strong> support@resume-roaster.com</p>
                <p><strong>Address:</strong> 600 California St, San Francisco, CA 94108</p>
                <p><strong>Phone:</strong> +1 (415) 430-****</p>
              </div>

              <div className="mt-6">
                <Link href="/contact">
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
} 