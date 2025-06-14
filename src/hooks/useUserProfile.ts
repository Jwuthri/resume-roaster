import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface UserProfileData {
  resumeData?: any
  currentRoastId?: string | null
  currentJobDescription?: string | null
  isFromAnalysis?: boolean
  isFromDashboard?: boolean
  lastPage?: string | null
}

interface UserProfile {
  id?: string
  userId?: string
  resumeData?: any
  currentRoastId?: string | null
  currentJobDescription?: string | null
  isFromAnalysis?: boolean
  isFromDashboard?: boolean
  lastPage?: string | null
  createdAt?: string
  updatedAt?: string
}

export function useUserProfile() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load profile data from the most recent GeneratedResume
  const loadProfile = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/resume-data')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load profile')
      }

      setProfile(result.data)
    } catch (err) {
      console.error('Error loading user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.email, status])

  // Save profile data - now stores in localStorage for temporary data
  const saveProfile = useCallback(async (data: UserProfileData) => {
    if (status !== 'authenticated' || !session?.user?.email) {
      console.warn('Cannot save profile: user not authenticated')
      return
    }

    try {
      // For now, just store the resume data in localStorage
      // The actual data will be saved when generating an optimized resume
      if (data.resumeData) {
        localStorage.setItem('resumeFormData', JSON.stringify(data.resumeData))
      }

      // Update the profile state with the new data
      setProfile(prev => ({
        ...prev,
        ...data
      }))

      return { ...profile, ...data }
    } catch (err) {
      console.error('Error saving user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      throw err
    }
  }, [session?.user?.email, status, profile])

  // Update specific fields in the profile
  const updateProfile = useCallback(async (updates: Partial<UserProfileData>) => {
    return saveProfile(updates)
  }, [saveProfile])

  // Clear specific fields
  const clearProfile = useCallback(async (fields?: (keyof UserProfileData)[]) => {
    if (!fields) {
      // Clear all fields
      localStorage.removeItem('resumeFormData')
      return saveProfile({
        resumeData: null,
        currentRoastId: null,
        currentJobDescription: null,
        isFromAnalysis: false,
        isFromDashboard: false,
        lastPage: null
      })
    } else {
      // Clear specific fields
      const updates: UserProfileData = {}
      fields.forEach(field => {
        if (field === 'isFromAnalysis' || field === 'isFromDashboard') {
          updates[field] = false
        } else {
          updates[field] = null
        }
      })
      return saveProfile(updates)
    }
  }, [saveProfile])

  // Load profile on mount and when session changes
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return {
    profile,
    loading,
    error,
    saveProfile,
    updateProfile,
    clearProfile,
    reload: loadProfile
  }
} 