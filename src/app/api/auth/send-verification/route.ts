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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any existing verification tokens for this user
    await db.verificationToken.deleteMany({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION'
      }
    })

    // Create new verification token
    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'EMAIL_VERIFICATION',
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

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`
    
    await resend.emails.send({
      from: 'Resume Roaster <noreply@resume-roaster.xyz>',
      to: [email],
      subject: 'Verify your email address - Resume Roaster',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #f97316; margin: 0;">🔥 Resume Roaster</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            
            <p>Hi ${user.name || 'there'},</p>
            
            <p>Thanks for signing up for Resume Roaster! To complete your registration and start getting brutal feedback on your resume, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #666; font-size: 14px; word-break: break-all;">
              ${verificationUrl}
            </p>
            
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #f97316; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Security Note:</strong> This verification link will expire in 24 hours. If you didn't create an account with Resume Roaster, you can safely ignore this email.
              </p>
            </div>
            
            <p>Once verified, you'll get access to:</p>
            <ul style="color: #666;">
              <li>3 free resume roasts to get started</li>
              <li>Detailed feedback on your resume's strengths and weaknesses</li>
              <li>ATS optimization suggestions</li>
              <li>Professional resume templates</li>
            </ul>
            
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
      message: "Verification email sent successfully"
    })

  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
} 