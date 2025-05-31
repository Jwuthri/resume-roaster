import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for the application
 * This ensures consistent URL generation across all API routes
 */
export function getBaseUrl(): string {
  // In production, prioritize NEXTAUTH_URL if it's a full URL
  if (process.env.NEXTAUTH_URL) {
    const url = process.env.NEXTAUTH_URL.trim()
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url.replace(/\/$/, '') // Remove trailing slash
    }
  }
  
  // In Vercel, use VERCEL_URL with https
  if (process.env.VERCEL_URL) {
    const url = process.env.VERCEL_URL.trim()
    // VERCEL_URL doesn't include protocol, so add https
    if (!url.startsWith('http')) {
      return `https://${url}`
    }
    return url.replace(/\/$/, '') // Remove trailing slash
  }
  
  // Check for custom domain in production
  if (process.env.NODE_ENV === 'production' && process.env.CUSTOM_DOMAIN) {
    const domain = process.env.CUSTOM_DOMAIN.trim()
    if (!domain.startsWith('http')) {
      return `https://${domain}`
    }
    return domain.replace(/\/$/, '') // Remove trailing slash
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000'
}
