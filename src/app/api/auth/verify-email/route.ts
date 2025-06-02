import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    // Find the verification token
    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Verification token has expired" },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (verificationToken.usedAt) {
      return NextResponse.json(
        { error: "Verification token has already been used" },
        { status: 400 }
      )
    }

    // Check if user is already verified
    if (verificationToken.user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Verify the user's email
    await db.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() }
    })

    // Mark the token as used
    await db.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: "Email verified successfully"
    })

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
} 