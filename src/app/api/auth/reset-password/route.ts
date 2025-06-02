import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      )
    }

    if (password.length < 5) {
      return NextResponse.json(
        { error: "Password must be at least 5 characters long" },
        { status: 400 }
      )
    }

    // Find the password reset token
    const resetToken = await db.verificationToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Check if token is for password reset
    if (resetToken.type !== 'PASSWORD_RESET') {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: "Reset token has already been used" },
        { status: 400 }
      )
    }

    // Check if user has a password (not OAuth-only account)
    if (!resetToken.user.hashedPassword) {
      return NextResponse.json(
        { error: "This account uses social login. Password reset is not available." },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user's password and mark token as used
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { hashedPassword }
      }),
      db.verificationToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      })
    ])

    return NextResponse.json({
      success: true,
      message: "Password reset successfully"
    })

  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
} 