import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/database"
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (password.length < 5) {
      return NextResponse.json(
        { error: "Password must be at least 5 characters long" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        )
      } else {
        // User exists but email not verified - resend verification
        return NextResponse.json(
          { 
            error: "An account with this email exists but is not verified. Please check your email for the verification link or request a new one.",
            needsVerification: true,
            email: email
          },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user (unverified)
    const user = await db.user.create({
      data: {
        name,
        email,
        hashedPassword,
        subscriptionTier: "FREE",
        monthlyRoasts: 0,
        totalRoasts: 0,
        lastRoastReset: new Date(),
        emailVerified: null // Explicitly set as unverified
      }
    })

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification token
    await db.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt
      }
    })

    // Send verification email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
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
                <h2 style="color: #333; margin-top: 0;">Welcome to Resume Roaster!</h2>
                
                <p>Hi ${name},</p>
                
                <p>Thanks for signing up! To complete your registration and start getting brutal feedback on your resume, please verify your email address.</p>
                
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
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // Don't fail registration if email fails, but log it
      }
    }

    return NextResponse.json(
      { 
        message: "Account created successfully. Please check your email to verify your account before signing in.",
        requiresVerification: true,
        email: email
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 