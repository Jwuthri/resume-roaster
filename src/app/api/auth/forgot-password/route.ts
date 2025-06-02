import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, we've sent a password reset link."
      })
    }

    // Check if user has a password (not OAuth-only account)
    if (!user.hashedPassword) {
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, we've sent a password reset link."
      })
    }

    // Generate password reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing password reset tokens for this user
    await db.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET'
      }
    })

    // Create new password reset token
    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'PASSWORD_RESET',
        expiresAt
      }
    })

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      )
    }

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`
    
    await resend.emails.send({
      from: 'Resume Roaster <noreply@resume-roaster.xyz>',
      to: [email],
      subject: 'Reset your password - Resume Roaster',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #f97316; margin: 0;">🔥 Resume Roaster</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            
            <p>Hi ${user.name || 'there'},</p>
            
            <p>We received a request to reset your password for your Resume Roaster account. If you didn't make this request, you can safely ignore this email.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #666; font-size: 14px; word-break: break-all;">
              ${resetUrl}
            </p>
            
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #f97316; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Security Note:</strong> This password reset link will expire in 1 hour. If you didn't request this reset, please contact our support team immediately.
              </p>
            </div>
            
            <p>For your security, this link can only be used once and will expire soon.</p>
            
            <p>Best regards,<br>
            The Resume Roaster Team</p>
          </div>
          
          <div style="text-align: center; padding: 20px 0; color: #666; font-size: 12px;">
            <p>Resume Roaster - Making resumes that get noticed</p>
            <p>If you have any questions, contact us at support@resume-roaster.xyz</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent a password reset link."
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    )
  }
} 