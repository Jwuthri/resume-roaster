"use client"

import { Flame, ArrowLeft, Shield, Eye, Lock, Database, Users, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Footer } from "@/components/ui/footer"
import { Navigation } from "@/components/ui/navigation"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* Navigation */}
      <Navigation currentPage="privacy" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: January 2025</p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-500" />
                <span>Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Resume Roaster ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our resume 
                analysis service.
              </p>
              <p>
                By using our service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-green-500" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                  <li>• <strong>Resume Content:</strong> The text and information contained in your uploaded resume files</li>
                  <li>• <strong>Payment Information:</strong> Billing details for premium subscriptions (processed securely by our payment providers)</li>
                  <li>• <strong>Communication Data:</strong> Messages you send us through contact forms or support channels</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Automatically Collected Information</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Usage Data:</strong> How you interact with our service, features used, and time spent</li>
                  <li>• <strong>Device Information:</strong> Browser type, operating system, and device identifiers</li>
                  <li>• <strong>Log Data:</strong> IP addresses, access times, and pages viewed</li>
                  <li>• <strong>Cookies:</strong> Small data files stored on your device to improve your experience</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-purple-500" />
                <span>How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Provision</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Analyze and provide feedback on your resume content</li>
                    <li>• Generate AI-powered suggestions and improvements</li>
                    <li>• Maintain your account and provide customer support</li>
                    <li>• Process payments and manage subscriptions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Improvement</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Improve our AI models and analysis accuracy</li>
                    <li>• Develop new features and enhance user experience</li>
                    <li>• Monitor service performance and troubleshoot issues</li>
                    <li>• Conduct research and analytics (using anonymized data)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Communication</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Send service-related notifications and updates</li>
                    <li>• Respond to your inquiries and provide support</li>
                    <li>• Send marketing communications (with your consent)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing and Disclosure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-500" />
                <span>Data Sharing and Disclosure</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  We do not sell, trade, or rent your personal information to third parties. We may share your 
                  information only in the following circumstances:
                </p>
                
                <ul className="space-y-3 text-gray-600">
                  <li>
                    <strong>Service Providers:</strong> With trusted third-party vendors who help us operate our 
                    service (e.g., cloud hosting, payment processing, email delivery)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law, court order, or government request
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets
                  </li>
                  <li>
                    <strong>Safety and Security:</strong> To protect the rights, property, or safety of Resume Roaster, 
                    our users, or others
                  </li>
                  <li>
                    <strong>With Your Consent:</strong> When you explicitly agree to share your information
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-500" />
                <span>Data Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  We implement appropriate technical and organizational security measures to protect your information:
                </p>
                
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Encryption:</strong> Data is encrypted in transit and at rest</li>
                  <li>• <strong>Access Controls:</strong> Limited access to personal data on a need-to-know basis</li>
                  <li>• <strong>Regular Audits:</strong> Security practices are regularly reviewed and updated</li>
                  <li>• <strong>Secure Infrastructure:</strong> Industry-standard cloud security practices</li>
                  <li>• <strong>Data Minimization:</strong> We collect only the data necessary for our services</li>
                </ul>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> While we strive to protect your information, no method of transmission 
                    over the internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">You have the following rights regarding your personal information:</p>
                
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li>• <strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li>• <strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li>• <strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li>• <strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li>• <strong>Account Deletion:</strong> Delete your account and associated data</li>
                </ul>

                <p className="text-gray-600">
                  To exercise these rights, please contact us at support@resume-roaster.xyz.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Account Data:</strong> Retained while your account is active</li>
                  <li>• <strong>Resume Content:</strong> Stored for the duration of your account plus 30 days</li>
                  <li>• <strong>Usage Data:</strong> Retained for up to 2 years for analytics purposes</li>
                  <li>• <strong>Support Communications:</strong> Retained for 3 years</li>
                  <li>• <strong>Payment Records:</strong> Retained as required by law (typically 7 years)</li>
                </ul>

                <p className="text-gray-600">
                  When you delete your account, we will delete your personal information within 30 days, 
                  except where retention is required by law.
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
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="space-y-2 text-orange-700">
                <p><strong>Email:</strong> support@resume-roaster.xyz</p>
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

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. 
                Significant changes will be communicated via email or prominent notice on our service.
              </p>
              
              <p className="text-gray-600 mt-4">
                Your continued use of our service after any changes indicates your acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
} 