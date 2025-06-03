import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/session-provider";
import { ChatbotProvider } from "@/components/providers/chatbot-provider";
import { Toaster } from "sonner";
import { Chatbot } from "@/components/ui/chatbot";
import { PostHogProvider } from "@/components/providers/posthog-provider";

export const metadata: Metadata = {
  title: "Resume Roaster - Brutally Honest Resume Feedback",
  description: "Get AI-powered, brutally honest feedback on your resume. Transform weak resumes into interview magnets with Resume Roaster's intelligent analysis and optimization suggestions.",
  keywords: ["resume", "feedback", "AI", "job search", "career", "optimization", "ATS"],
  authors: [{ name: "Resume Roaster Team" }],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    apple: { url: '/icon', type: 'image/png', sizes: '32x32' },
  },
  openGraph: {
    title: "Resume Roaster - Brutally Honest Resume Feedback",
    description: "Transform your resume with AI-powered analysis and get the job you deserve",
    type: "website",
    siteName: "Resume Roaster",
    images: [
      {
        url: '/icon',
        width: 32,
        height: 32,
        alt: 'Resume Roaster Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: "Resume Roaster - Brutally Honest Resume Feedback",
    description: "Transform your resume with AI-powered analysis and get the job you deserve",
    images: ['/icon'],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PostHogProvider>
          <Providers>
            <ChatbotProvider>
              {children}
              <Chatbot />
            </ChatbotProvider>
          </Providers>
        </PostHogProvider>
        <Toaster />
      </body>
    </html>
  );
}