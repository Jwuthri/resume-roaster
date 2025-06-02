import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import bcrypt from "bcryptjs"
import { db } from "./database"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      emailVerified?: Date | null
    }
  }
  
  interface User {
    emailVerified?: Date | null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.hashedPassword) {
          return null
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email address before signing in. Check your email for the verification link.")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.emailVerified = user.emailVerified
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        return true
      }

      // Handle OAuth sign in
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email! }
          })

          if (!existingUser) {
            // Create new user for OAuth (automatically verified since OAuth providers verify emails)
            await db.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: new Date(), // OAuth users are automatically verified
                subscriptionTier: "FREE",
                monthlyRoasts: 0,
                totalRoasts: 0,
                lastRoastReset: new Date()
              }
            })
          } else if (!existingUser.emailVerified) {
            // If user exists but email not verified, verify it now (OAuth providers verify emails)
            await db.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() }
            })
          }
          return true
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }

      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
} 