import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { db } from "./database"
import { redirect } from "next/navigation"

export async function requireEmailVerification() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true }
  })

  if (!user?.emailVerified) {
    redirect('/auth/verify-email-required')
  }

  return session
}

export async function checkEmailVerification(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true }
  })

  return !!user?.emailVerified
} 