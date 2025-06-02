import { useState } from 'react'
import { toast } from 'sonner'

interface AnalysisData {
  overallScore: number
  scoreLabel: string
  strengths: string[]
  weaknesses: string[]
  suggestions: Array<{
    section: string
    issue: string
    solution: string
    priority: 'high' | 'medium' | 'low'
  }>
  keywordMatch: {
    matched: string[]
    missing: string[]
  }
  atsIssues?: string[]
}

interface ShareSettings {
  expirationDays?: number
  allowComments?: boolean
}

export function useAnalysisActions() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const downloadReport = async (analysisData: AnalysisData, resumeData?: any, jobDescription?: string) => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      const response = await fetch('/api/download-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisData,
          resumeData,
          jobDescription
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'resume-analysis-report.txt'

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Report downloaded successfully!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to download report')
    } finally {
      setIsDownloading(false)
    }
  }

  const shareAnalysis = async (
    analysisData: AnalysisData, 
    settings?: ShareSettings,
    resumeData?: any,
    jobDescription?: string,
    pdfImages?: string[],
    analysisId?: string
  ) => {
    if (isSharing) return null

    setIsSharing(true)
    try {
      // Create comprehensive data object that includes all necessary information
      const comprehensiveData = {
        analysis: analysisData,
        resumeData,
        jobDescription,
        pdfImages: pdfImages || [],
        roastId: analysisId // Include the roast ID for the foreign key
      }

      const response = await fetch('/api/share-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisData: comprehensiveData,
          settings: settings || { expirationDays: 30 }
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create shareable link')
      }

      const result = await response.json()
      
      // Copy to clipboard
      await navigator.clipboard.writeText(result.shareUrl)
      toast.success('Shareable link copied to clipboard!')
      
      return {
        shareId: result.shareId,
        shareUrl: result.shareUrl,
        expiresAt: result.expiresAt
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create shareable link')
      return null
    } finally {
      setIsSharing(false)
    }
  }

  const getSharedAnalyses = async () => {
    try {
      const response = await fetch('/api/share-analysis')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch shared analyses')
      }

      const result = await response.json()
      return result.sharedAnalyses
    } catch (error) {
      console.error('Get shared analyses error:', error)
      toast.error('Failed to load shared analyses')
      return []
    }
  }

  const deleteSharedAnalysis = async (shareId: string) => {
    try {
      const response = await fetch('/api/share-analysis', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shareId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete shared analysis')
      }

      toast.success('Shared analysis deleted successfully!')
      return true
    } catch (error) {
      console.error('Delete shared analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete shared analysis')
      return false
    }
  }

  return {
    downloadReport,
    shareAnalysis,
    getSharedAnalyses,
    deleteSharedAnalysis,
    isDownloading,
    isSharing
  }
} 