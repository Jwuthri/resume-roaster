import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { analysisData, resumeData, jobDescription } = await request.json()

    if (!analysisData) {
      return NextResponse.json(
        { error: 'Analysis data is required' },
        { status: 400 }
      )
    }

    // Generate formatted report content
    const reportContent = generateReportContent(analysisData, resumeData, jobDescription)
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `resume-analysis-report-${timestamp}.txt`

    // Return the report content as a downloadable file
    return new NextResponse(reportContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(reportContent, 'utf8').toString(),
      },
    })

  } catch (error) {
    console.error('Download report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

function generateReportContent(analysisData: any, resumeData?: any, jobDescription?: string): string {
  const { 
    overallScore, 
    scoreLabel, 
    scoringBreakdown,
    scoreJustification,
    strengths, 
    weaknesses, 
    suggestions, 
    keywordMatch, 
    atsIssues 
  } = analysisData

  // Helper function to safely calculate presentation percentage
  const getPresentationPercentage = (presentationScore: number) => {
    // Ensure the score is within valid range (0-5)
    const validScore = Math.max(0, Math.min(5, Number(presentationScore) || 0))
    return Math.round((validScore / 5) * 100)
  }

  const report = `
RESUME ANALYSIS REPORT
Generated on: ${new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

================================================================================
OVERALL ASSESSMENT
================================================================================

Score: ${overallScore}/100 (${scoreLabel})

${scoreJustification ? `
SCORE EXPLANATION:
${scoreJustification}
` : ''}

${scoringBreakdown ? `
DETAILED SCORING BREAKDOWN:
• Skills Match: ${Math.round((scoringBreakdown.skills / 40) * 100)}/100 (${scoringBreakdown.skills}/40 points)
• Experience Relevance: ${Math.round((scoringBreakdown.experience / 35) * 100)}/100 (${scoringBreakdown.experience}/35 points)
• Achievement Quality: ${Math.round((scoringBreakdown.achievements / 20) * 100)}/100 (${scoringBreakdown.achievements}/20 points)
• Presentation & Format: ${getPresentationPercentage(scoringBreakdown.presentation)}/100 (${Math.max(0, Math.min(5, Number(scoringBreakdown.presentation) || 0))}/5 points)

SCORING METHODOLOGY:
- Skills Match: Up to 40 points (40% of total score)
- Experience Relevance: Up to 35 points (35% of total score)
- Achievement Quality: Up to 20 points (20% of total score)
- Presentation & Format: Up to 5 points (5% of total score)
` : ''}

================================================================================
STRENGTHS
================================================================================

${strengths.map((strength: string, index: number) => `${index + 1}. ${strength}`).join('\n')}

================================================================================
AREAS FOR IMPROVEMENT
================================================================================

${weaknesses.map((weakness: string, index: number) => `${index + 1}. ${weakness}`).join('\n')}

================================================================================
SPECIFIC RECOMMENDATIONS
================================================================================

${suggestions.map((suggestion: any, index: number) => `
${index + 1}. ${suggestion.section} [${suggestion.priority.toUpperCase()} PRIORITY]
   Issue: ${suggestion.issue}
   Solution: ${suggestion.solution}
`).join('\n')}

================================================================================
KEYWORD ANALYSIS
================================================================================

${keywordMatch.matchPercentage !== undefined ? `
KEYWORD MATCH RATE: ${keywordMatch.matchPercentage}%
${keywordMatch.matchPercentage >= 70 ? '✅ Excellent keyword optimization!' : 
  keywordMatch.matchPercentage >= 50 ? '⚠️  Good match, but room for improvement' : 
  '❌ Needs significant keyword optimization'}

` : ''}✅ MATCHED KEYWORDS:
${keywordMatch.matched?.length > 0 ? keywordMatch.matched.map((keyword: string) => `• ${keyword}`).join('\n') : '• None identified'}

❌ MISSING KEYWORDS:
${keywordMatch.missing?.length > 0 ? keywordMatch.missing.map((keyword: string) => `• ${keyword}`).join('\n') : '• None identified'}

================================================================================
ATS COMPATIBILITY ISSUES
================================================================================

${atsIssues?.length > 0 ? atsIssues.map((issue: string, index: number) => `${index + 1}. ${issue}`).join('\n') : 'No major ATS issues identified.'}

================================================================================
RESUME METADATA
================================================================================

${resumeData ? `
• File Name: ${resumeData.filename || 'N/A'}
• Word Count: ${resumeData.wordCount || 'N/A'}
• Page Count: ${resumeData.pageCount || 'N/A'}
• Analysis Date: ${new Date().toLocaleDateString()}
` : 'Resume metadata not available.'}

================================================================================
NEXT STEPS
================================================================================

IMMEDIATE ACTIONS (Complete within 1 hour):
1. Focus on HIGH priority recommendations first
2. Add missing keywords naturally throughout your resume
3. Fix any formatting/ATS compatibility issues

SHORT-TERM IMPROVEMENTS (Complete within 1 week):
4. Quantify achievements with specific metrics and numbers
5. Rewrite weak bullet points using action verbs and results
6. Optimize summary/objective section for impact

LONG-TERM STRATEGY (Complete within 1 month):
7. Gather additional achievements and certifications
8. Test your updated resume with ATS checkers
9. Get feedback from industry professionals
10. Tailor resume for each specific job application

================================================================================
SCORING GUIDE
================================================================================

90-100: Exceptional - Ready for top-tier positions
80-89:  Strong - Minor tweaks needed
70-79:  Good - Some improvements required  
60-69:  Fair - Moderate work needed
50-59:  Weak - Significant improvements required
0-49:   Poor - Major overhaul needed

================================================================================
DISCLAIMER
================================================================================

This analysis is generated by AI and should be used as guidance only. 
Consider seeking additional feedback from career professionals and industry experts.
Resume optimization is an iterative process - keep refining based on results.

Report generated by Resume Roaster - Your AI-powered resume optimization tool.
Visit us at: https://resume-roaster.com
`

  return report.trim()
}

// Alternative PDF generation endpoint (commented out for now)
/*
export async function GET(request: NextRequest) {
  // This would be for PDF generation using puppeteer or similar
  // Implementation would require server-side rendering
}
*/ 