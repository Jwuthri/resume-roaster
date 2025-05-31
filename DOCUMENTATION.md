# Resume Roaster - Comprehensive Platform Documentation

## 📖 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Authentication & User Management](#authentication--user-management)
4. [Resume Analysis & Optimization](#resume-analysis--optimization)
5. [PDF Extraction & Processing](#pdf-extraction--processing)
6. [Subscription & Payment System](#subscription--payment-system)
7. [AI Chatbot & Assistant](#ai-chatbot--assistant)
8. [Sharing & Collaboration](#sharing--collaboration)
9. [Admin & Analytics](#admin--analytics)
10. [Database Schema](#database-schema)
11. [API Endpoints Reference](#api-endpoints-reference)
12. [Frontend Components](#frontend-components)
13. [Security & Performance](#security--performance)
14. [Development & Deployment](#development--deployment)

---

## 📋 Platform Overview

### What is Resume Roaster?

Resume Roaster is a comprehensive SaaS platform that provides AI-powered, brutally honest resume analysis and optimization. The platform helps job seekers transform weak resumes into "interview magnets" through detailed analysis, ATS optimization, and professional resume generation.

### Core Value Proposition

- **Brutal Honesty**: No sugar-coating, real actionable feedback
- **AI-Powered Intelligence**: Advanced extraction and analysis capabilities  
- **Job-Specific Optimization**: Tailored to actual job requirements
- **Comprehensive Platform**: End-to-end resume improvement solution
- **Professional Results**: Multiple export formats and templates
- **Usage Analytics**: Detailed insights for continuous improvement

### Key Features

- ✅ AI-powered resume analysis with 0-100% compatibility scoring
- ✅ Job-specific optimization by matching resumes against job descriptions
- ✅ ATS (Applicant Tracking System) optimization
- ✅ Professional resume generation with multiple templates
- ✅ Cover letter generation tailored to job descriptions
- ✅ AI chatbot for career guidance and resume advice
- ✅ Sharing system for analysis results
- ✅ Subscription-based usage with tiered features
- ✅ Comprehensive admin and analytics dashboard

---

## 🏗️ Architecture & Technology Stack

### Core Technologies

**Frontend:**
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** with Radix UI components
- **Custom React Hooks** for state management

**Backend:**
- **Next.js API Routes** (serverless architecture)
- **PostgreSQL** with Prisma ORM
- **NextAuth.js** for authentication
- **Stripe** for payment processing

**AI & Processing:**
- **Anthropic Claude**: Sonnet 4, Haiku (primary AI models)
- **OpenAI GPT**: 4.1 Mini, 4.1 (secondary AI models)
- **PDF Processing**: pdf-parse, node-poppler, puppeteer
- **Document Generation**: jsPDF, docx, html2canvas

**Infrastructure:**
- **Vercel** deployment platform
- **ImageMagick & Poppler** for PDF to image conversion
- **Resend** for email services

### Architecture Patterns

- **Serverless API Routes**: All backend logic in Next.js API routes
- **Service Layer Pattern**: Centralized database services (ResumeService, UserService)
- **Caching Strategy**: Content-based caching with hash-based deduplication
- **Event Logging**: Comprehensive LLM call tracking for analytics
- **Hook-based State Management**: Custom React hooks for complex UI state

---

## 🔐 Authentication & User Management

### Authentication Methods

**Credentials Provider (Active):**
- Email and password authentication
- Passwords hashed using bcryptjs (12 salt rounds)
- Minimum password length: 5 characters
- Automatic user creation with default FREE tier

**OAuth Providers (Configured but Disabled):**
- Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- GitHub OAuth (GITHUB_ID, GITHUB_SECRET)
- Feature disabled in UI with "Feature Not Available" warnings

### Registration & Login Flow

**Registration (`/auth/signup`):**
1. User form validation (name, email, password confirmation)
2. Server-side validation and duplicate email check
3. Password hashing with bcrypt (12 rounds)
4. User creation with default FREE subscription
5. Automatic sign-in attempt and redirect to home

**Login (`/auth/signin`):**
1. Email/password validation
2. NextAuth credential provider authentication
3. Session creation with JWT strategy
4. Redirect to home page

### Session Management

- **Strategy**: JWT-based sessions
- **Session Extension**: Custom types include user ID
- **Session Provider**: React context wrapper
- **Protected Routes**: Middleware-based route protection

### Protected Routes

**Pages:**
- `/dashboard` - User dashboard
- `/resume-optimizer` - Resume optimization tools

**API Routes:**
- `/api/user/*` - All user-specific endpoints
- `/api/admin/*` - Admin-only endpoints
- `/api/share-analysis` - Analysis sharing
- `/api/download-report` - Report downloads

### User Profile Management

**Profile API (`/api/user/profile`):**
- **GET**: Retrieve user profile data
- **POST**: Update user profile (currently name only)

**Subscription Management (`/api/user/subscription`):**
- **GET**: Returns subscription tier, usage tracking, Stripe IDs
- Automatic monthly usage reset based on `lastRoastReset`

**Admin Features (`/api/admin/update-user-plan`):**
- Email-based admin authorization
- Update user subscription tiers
- Reset usage counters
- Manage Stripe customer/subscription IDs

---

## 🎯 Resume Analysis & Optimization

### Analysis System Overview

The resume analysis system uses advanced AI to evaluate resumes against job descriptions, providing detailed feedback and scoring on a 100-point scale.

### Core Analysis API (`/api/analyze-resume`)

**Features:**
- Comprehensive 4-component scoring system
- AI-powered analysis using Anthropic Claude Sonnet
- Content caching for improved performance
- Detailed LLM call logging with cost tracking

### Scoring Algorithm

**1. Skills Match (40 points max)**
```
Deduction-based scoring:
- Missing required skill: -5 points each
- Missing preferred skills: -2 points each
- Outdated skill versions: -3 points each
- No evidence of skill proficiency: -3 points each
**Minimum: 0 points**
```

**2. Experience Relevance (35 points max)**
```
Adjustment-based scoring:
- Perfect role match: Keep 35 points
- Similar role, different industry: -5 to -12 points
- Different role, similar skills: -12 to -18 points
- Entry-level for senior position: -25 points
- Years of experience gap: -3 per year short
**Minimum: 0 points**
```

**3. Achievement Alignment (20 points max)**
```
Addition-based scoring:
- Each quantified achievement relevant to JD: +4 points
- Each achievement without metrics: +2 points
- Generic responsibilities only: +0 points
```

**4. Presentation Quality (5 points max)**
```
Deduction-based scoring:
- Poor formatting: -2 points
- Typos/grammar errors: -1 per error
- Missing key sections: -1 each
- Wall of text/poor readability: -2 points
**IMPORTANT: Minimum score is 0 points (never negative)**
```

### Analysis Results Structure

```typescript
interface AnalysisData {
  overallScore: number              // 0-100 overall score
  scoreLabel: string               // "Strong Match", "Needs Improvement", etc.
  scoringBreakdown: {              // Detailed component scores
    skills: number                 // Raw score out of 40
    experience: number             // Raw score out of 35
    achievements: number           // Raw score out of 20
    presentation: number           // Raw score out of 5
  }
  scoreJustification: string       // Markdown-formatted explanation
  strengths: string[]              // 3-5 strong points
  weaknesses: string[]             // 3-7 critical issues
  suggestions: Array<{             // Actionable improvements
    section: string
    issue: string
    solution: string
    priority: 'high' | 'medium' | 'low'
  }>
  keywordMatch: {                  // ATS optimization data
    matched: string[]
    missing: string[]
    matchPercentage: number
  }
  atsIssues: string[]             // ATS compatibility problems
}
```

### Resume Optimization System

**AI-Powered Optimization (`/api/optimize-resume`):**
- Multi-model support (OpenAI GPT, Anthropic Claude)
- Intelligent caching for existing optimized versions
- Structured data generation using function calling
- Content fallback strategies for missing data

**Template-Based Generation (`/api/generate-optimized-resume`):**
- Multiple professional resume templates
- ATS score calculation
- Keyword extraction and analysis
- HTML and Markdown output formats

### AI Model Integration

**Credit System:**
Resume Roaster uses a tiered credit system where different AI models cost different amounts of credits based on their capabilities:

**OpenAI Models:**
- `gpt-4.1-nano` - Basic operations (1 credit)
- `gpt-4.1-mini` - Standard analysis (4 credits)
- `gpt-4.1` - Advanced features (8 credits)
- `o4-mini-high` - Premium operations (12 credits)

**Anthropic Models:**
- `claude-3-5-haiku-20241022` - Fast responses (1 credit)
- `claude-sonnet-4-20250514` - Main analysis model (8 credits)
- `claude-opus-4-20250514` - Premium analysis (12 credits)

**Credit Cost Mapping:**
```typescript
export const MODEL_CREDIT_COSTS = {
  // OpenAI models
  'gpt-4.1-nano': 1,      // OpenAI Nano
  'gpt-4.1-mini': 4,      // OpenAI Mini  
  'gpt-4.1': 8,           // OpenAI Normal
  'o4-mini-high': 12,     // OpenAI Large
  // Anthropic models
  'claude-3-5-haiku-20241022': 1,     // Claude Haiku
  'claude-sonnet-4-20250514': 8,      // Claude Sonnet 4
  'claude-opus-4-20250514': 12,       // Claude Opus 4
} as const
```

**Model Selection Guidelines:**
- **1 Credit (Nano/Haiku)**: Basic tasks, simple formatting, quick responses
- **4 Credits (Mini)**: Standard resume analysis, cover letter generation
- **8 Credits (Sonnet)**: Advanced analysis, complex reasoning, premium quality
- **12 Credits (Opus)**: Ultimate quality, most complex tasks, highest accuracy

### Caching Strategy

**Cover Letter Caching:**
```typescript
function generateCoverLetterHash(
  resumeText: string, 
  jobSummaryId: string | null, 
  tone: string, 
  analysisId?: string, 
  llm?: string
): string
```

**Optimized Resume Caching:**
```typescript
function generateOptimizedResumeHash(
  resumeData: any, 
  jobDescription: string, 
  templateId: string, 
  analysisId?: string
): string
```

---

## 📄 PDF Extraction & Processing

### Extraction Methods

**Basic PDF Extraction (`/api/extract-pdf-basic`):**
- **Primary**: node-poppler (pdfToText method)
- **Fallback**: pdf-parse library
- **File Size Limit**: 10MB
- **Processing Time**: 5-10 seconds
- **Features**: File hash caching, cache bypass, metadata extraction

**AI-Powered Extraction (`/api/extract-pdf-ai`):**
- **Dual Method**: Basic extraction + AI enhancement
- **AI Models**: Anthropic Claude and OpenAI GPT support
- **Features**: PDF to image conversion, structured data extraction
- **Cost**: ~$0.01-0.05 per extraction

### Text Extraction Pipeline

**Multi-Format Support (`/api/extract-text`):**
- **PDF**: node-poppler → pdf-parse → metadata fallback
- **TXT**: Direct UTF-8 buffer reading
- **DOC**: Basic binary parsing with artifact removal
- **DOCX**: JSZip-based XML content extraction
- **File Size Limit**: 5MB for text files

### AI Enhancement Features

**Claude Sonnet 4 Integration:**
- Tool-based extraction with structured schema
- Markdown formatting output
- Section identification and summarization
- Cost: ~$0.02-0.05 per extraction

**GPT-4 Mini Integration:**
- Function calling for structured extraction
- JSON response formatting
- Cost: ~$0.01-0.025 per extraction

### Image Processing

**PDF to Image Conversion (`/lib/pdf-to-image.ts`):**
- **Primary Tool**: ImageMagick convert command
- **Fallback**: Poppler pdftoppm utility
- **Features**: 150 DPI rendering, PNG output, Base64 encoding
- **Limits**: 3-page limit, 1024px scaling

### Performance Optimization

**Caching System:**
- SHA-256 content hashing
- Method-specific caching (basic vs AI)
- Database storage with metadata
- Cache bypass capability

**Processing Times:**
- Basic extraction: 5-10 seconds
- AI extraction: 10-30 seconds
- Cache retrieval: Sub-second
- Image generation: Additional 2-5 seconds

---

## 💳 Subscription & Payment System

### Subscription Tiers

**FREE Tier:**
- **Monthly Credits**: 10 credits
- **Features**: AI PDF extraction, basic analysis, email support
- **Price**: $0
- **Usage**: Can perform 10 basic operations (1-credit models) or 2-3 mini operations (4-credit models)

**PLUS Tier:**
- **Monthly Credits**: 200 credits
- **Features**: All FREE + document history, cover letter generation, ATS optimization
- **Price**: $9.99/month or $99.99/year (17% savings)
- **Usage**: Mix of model tiers - approximately 50 mini operations or 25 premium operations or 16 ultimate operations

**PREMIUM Tier:**
- **Monthly Credits**: Unlimited
- **Features**: All PLUS + team tools, API access, custom branding, dedicated support
- **Price**: $49.99/month or $499.99/year
- **Usage**: No credit restrictions, use any model tier without limits

**Credit Usage Examples:**
- **Basic User (10 credits)**: 10 nano analyses OR 2 mini analyses OR 1 premium analysis
- **Plus User (200 credits)**: 200 nano analyses OR 50 mini analyses OR 25 premium analyses OR 16 ultimate analyses
- **Mixed Usage**: 5 mini (20 credits) + 10 premium (80 credits) + 8 ultimate (96 credits) = 196 credits total

### Payment Processing

**Stripe Integration (`/lib/stripe.ts`):**
- Checkout session creation with subscription mode
- Customer portal for subscription management
- Webhook handling for subscription lifecycle
- Price ID validation and customer management

**Checkout Flow (`/api/stripe/create-checkout-session`):**
1. Authentication and Stripe configuration validation
2. Customer management (retrieve/create Stripe customer)
3. Checkout session creation with metadata
4. Success/cancel URL handling

### Usage Tracking

**Database Schema:**
```prisma
model User {
  subscriptionTier   SubscriptionTier @default(FREE)
  subscriptionId     String?
  customerId         String?
  monthlyRoasts      Int @default(0)
  totalRoasts        Int @default(0)
  lastRoastReset     DateTime @default(now())
}
```

**Limit Enforcement:**
- Automatic monthly counter resets
- Tier-based limits (FREE: 10, PLUS: 200, PREMIUM: unlimited)
- Real-time usage tracking and validation

### Webhook Events

**Supported Events (`/api/stripe/webhook`):**
- `checkout.session.completed` - Update subscription and reset usage
- `customer.subscription.created/updated` - Handle subscription changes
- `customer.subscription.deleted` - Downgrade to FREE tier
- `invoice.payment_succeeded/failed` - Payment tracking

---

## 🤖 AI Chatbot & Assistant

### Chatbot System Overview

**Purpose**: Professional resume and career advisor assistant providing expert guidance on resume optimization, ATS tips, career advancement, and interview preparation.

### Core Functionality (`/api/chatbot`)

**Expert Knowledge Areas:**
- Resume structure and formatting
- ATS (Applicant Tracking System) optimization
- Industry-specific resume advice
- Cover letter guidance
- LinkedIn profile optimization
- Interview preparation
- Career transition strategies

**Conversation Management:**
- Automatic conversation creation
- Context preservation (last 10 messages)
- Auto-generated conversation titles
- Support for authenticated and guest users

### AI Model Usage

**Primary Models:**
- **OpenAI GPT-4.1-nano**: Cost-efficient chatbot responses
- **Anthropic Claude Haiku**: Fast responses for quick queries
- **Claude Sonnet**: Complex career guidance and analysis

**Model Selection Strategy:**
- Chatbot: GPT-4.1-nano for cost efficiency
- Cover Letter Generation: Both OpenAI and Anthropic support
- Resume Optimization: Function calling with structured outputs

### UI/UX Features (`/components/ui/chatbot.tsx`)

**Design Elements:**
- Floating action button with sparkle effects
- Collapsible chat window (600px height)
- Conversation list with easy switching
- Quick action buttons for common queries
- Typing indicators and loading states

**User Experience:**
- Welcome message with capability overview
- 5 predefined quick action buttons
- Visual feedback and error handling
- Responsive design for all screen sizes

### Conversation Persistence (`/lib/chatbot-db.ts`)

**Database Integration:**
- Uses `LlmCall` and `LlmMessage` tables
- Operation type: `'chatbot_support'`
- Maintains message ordering and timestamps
- Links conversations to user accounts

### Advanced Features

**Cover Letter Generation (`/api/generate-cover-letter`):**
- Caching system for identical inputs
- Job summary integration
- Analysis data personalization
- Tone customization options

**Interview Preparation:**
- AI-generated personalized questions
- Practice mode with timer
- Multiple question categories (behavioral, technical, situational)
- Company research and salary negotiation advice

---

## 🔗 Sharing & Collaboration

### Sharing System Architecture

**Share Creation (`/api/share-analysis`):**
- **POST**: Create shareable links with unique IDs
- **GET**: Retrieve user's shared analyses
- **DELETE**: Remove shared analyses
- **Security**: 16-byte cryptographically secure random IDs

**Public Access (`/api/shared/[shareId]`):**
- No authentication required for viewing
- Automatic expiration (30-day default)
- View count tracking
- Read-only access with data sanitization

### Sharing Features

**Share Settings:**
```typescript
interface ShareSettings {
  expirationDays?: number // Default: 30 days
  allowComments?: boolean // Future feature
}
```

**Data Privacy:**
- Only analysis results shared (not personal data)
- Anonymized sharing with minimal user exposure
- No raw resume data in shared content

### Analysis Display (`/app/shared/[shareId]/page.tsx`)

**User Experience:**
- Comprehensive analysis visualization
- Interactive PDF viewer with multi-page navigation
- Professional branded layout
- Mobile-friendly responsive design

### Announcement System

**Announcements API (`/api/announcements`):**
- Tier-based targeting for specific subscription levels
- Time-based control with start/end dates
- User dismissal tracking
- Active status admin control

**UI Components:**
- Feature announcement banners
- Dynamic announcements loading
- Notification center with unread badges
- Type-based styling for different announcement types

---

## 🛠️ Admin & Analytics

### Admin User Management

**User Plan Management (`/api/admin/update-user-plan`):**
- **Authorization**: Hardcoded admin emails
- **Capabilities**: Update subscription tiers, reset usage, Stripe management
- **User Lookup**: Find users by email or ID
- **Billing Integration**: Update customer/subscription IDs

**Admin Authorization:**
```typescript
const adminEmails = [
  'support@resume-roaster.xyz',
  'julien@resume-roaster.xyz',
  'julien@resumeroaster.com',
  'admin@resumeroaster.com',
  'julien.wut@gmail.com'
]
```

### Analytics System

**LLM Analytics (`/api/llm-analytics`):**
- **User Analytics**: Individual LLM call history, token usage, costs
- **Admin Analytics**: System-wide usage statistics
- **Data Export**: Recent 50 calls with message counts
- **Cost Tracking**: Detailed USD cost tracking per operation

**Comprehensive Logging (`/lib/llm-logger.ts`):**
- Call creation tracking (provider, model, operation type)
- Message logging with tokens/costs
- Status updates (completion, errors, timeouts)
- Performance metrics and finish reasons

### User Support

**Contact System (`/api/contact`):**
- Email integration using Resend service
- Dual email system (support notification + user confirmation)
- Rich HTML templates with professional branding
- Form validation and auto-responder

### Performance Monitoring

**Middleware Protection:**
- Timeout headers for long-running AI operations
- Route protection with authentication
- Performance warnings for 60+ second operations
- Security headers and content-type protection

### Debug Tools

**Debug Endpoints:**
- `/api/debug/urls` - Environment variable inspection
- `/api/generate-cover-letter/debug` - Prompt generation preview
- Token estimation and cache checking

---

## 🗄️ Database Schema

### Core Models

**User Model:**
```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  hashedPassword    String?
  subscriptionTier  SubscriptionTier @default(FREE)
  subscriptionId    String?
  customerId        String?
  monthlyRoasts     Int      @default(0)
  totalRoasts       Int      @default(0)
  lastRoastReset    DateTime @default(now())
  emailVerified     DateTime?
  image             String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Resume Processing Models:**
```prisma
model Resume {
  id          String @id @default(cuid())
  userId      String
  filename    String
  content     Bytes
  extractedText String?
  pdfImages   String[]
  createdAt   DateTime @default(now())
}

model ExtractedResume {
  id            String @id @default(cuid())
  resumeId      String @unique
  personalInfo  Json?
  experience    Json?
  education     Json?
  skills        Json?
  sections      Json?
  markdownContent String?
}
```

**Analysis & Generation Models:**
```prisma
model GeneratedRoast {
  id                    String @id @default(cuid())
  userId                String
  extractedResumeId     String?
  extractedJobDescId    String?
  overallScore          Int
  scoringBreakdown      Json
  scoreJustification    String
  strengths             String[]
  weaknesses            String[]
  suggestions           Json[]
  keywordMatch          Json
  atsIssues             String[]
  createdAt             DateTime @default(now())
}
```

**LLM Tracking Models:**
```prisma
model LlmCall {
  id            String @id @default(cuid())
  userId        String?
  provider      String
  model         String
  operationType String
  status        String @default("pending")
  totalTokens   Int?
  totalCost     Float?
  startTime     DateTime @default(now())
  endTime       DateTime?
  createdAt     DateTime @default(now())
}
```

### Subscription Tiers

```prisma
enum SubscriptionTier {
  FREE      // 10 roasts/month
  PLUS      // 200 roasts/month
  PREMIUM   // Unlimited roasts
}
```

### Key Relationships

- User → Resumes (one-to-many)
- Resume → ExtractedResume (one-to-one)
- GeneratedRoast → ExtractedResume (many-to-one)
- GeneratedRoast → ExtractedJobDescription (many-to-one)
- User → LlmCall (one-to-many)
- LlmCall → LlmMessage (one-to-many)

---

## 🔌 API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers | No |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET/POST | `/api/user/profile` | User profile management | Yes |
| GET | `/api/user/subscription` | Subscription details | Yes |
| GET | `/api/user/limits` | Usage limits and quota | Yes |
| POST | `/api/user/increment-roast` | Increment usage counter | Yes |
| GET | `/api/user/analysis-history` | Analysis history with search | Yes |
| GET | `/api/user/analysis-history/[id]` | Individual analysis details | Yes |

### Resume Processing

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/extract-pdf-basic` | Basic PDF text extraction | No |
| POST | `/api/extract-pdf-ai` | AI-powered PDF extraction | Yes |
| POST | `/api/extract-text` | Multi-format text extraction | No |
| POST | `/api/extract-resume` | Structured resume extraction | Yes |
| POST | `/api/extract-job-description` | Job posting extraction | No |

### Analysis & Optimization

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/analyze-resume` | Comprehensive resume analysis | No |
| POST | `/api/optimize-resume` | AI resume optimization | Yes |
| POST | `/api/generate-optimized-resume` | Template-based resume generation | Yes |
| POST | `/api/generate-cover-letter` | AI cover letter generation | Yes |

### Sharing & Collaboration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET/POST/DELETE | `/api/share-analysis` | Share management | Yes |
| GET | `/api/shared/[shareId]` | Public share access | No |
| GET | `/api/announcements` | System announcements | No |

### Payment & Subscriptions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/stripe/create-checkout-session` | Stripe checkout | Yes |
| POST | `/api/stripe/create-portal-session` | Customer portal | Yes |
| POST | `/api/stripe/webhook` | Stripe webhooks | No |

### AI & Chatbot

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chatbot` | AI chatbot conversations | No |
| GET | `/api/llm-analytics` | LLM usage analytics | Yes |

### Admin & Support

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET/POST | `/api/admin/update-user-plan` | User plan management | Admin |
| POST | `/api/contact` | Contact form submission | No |
| GET | `/api/debug/urls` | Environment debugging | No |

---

## 🎨 Frontend Components

### Core UI Components (`/src/components/ui/`)

**Analysis & Results:**
- `analysis-loading.tsx` - Loading states for analysis
- `extracted-text-preview.tsx` - Resume text preview
- `pdf-preview.tsx` - PDF viewer with pagination
- `resume-optimizer.tsx` - Resume optimization interface
- `cover-letter-modal.tsx` - Cover letter generation modal

**Chat & Communication:**
- `chatbot.tsx` - AI chatbot interface
- `notification-center.tsx` - System notifications
- `feature-announcement-banner.tsx` - Feature announcements

**File & Data Handling:**
- `file-upload.tsx` - Drag-and-drop file upload
- `download-page.tsx` - Analysis download interface

**Navigation & Layout:**
- `navigation.tsx` - Main site navigation
- `footer.tsx` - Site footer
- `roast-limit-banner.tsx` - Usage limit warnings

### Custom Hooks (`/src/hooks/`)

**File Processing:**
- `useFileExtraction.ts` - Universal file processing
- `usePdfExtraction.ts` - Basic PDF extraction
- `usePdfExtractionAI.ts` - AI-powered PDF extraction

**Analysis & Generation:**
- `useAnalysisActions.ts` - Analysis sharing and downloads
- `useCoverLetter.ts` - Cover letter generation
- `useRoastLimit.ts` - Usage limit management

**Subscription & Features:**
- `useSubscription.ts` - Subscription management
- `useFeatureAnnouncements.ts` - Feature announcement handling

### Provider Components (`/src/components/providers/`)

- `session-provider.tsx` - NextAuth session context
- `chatbot-provider.tsx` - Chatbot state management

---

## 🔒 Security & Performance

### Security Measures

**Authentication & Authorization:**
- JWT-based session management
- Middleware route protection
- Admin email authorization
- Webhook signature verification

**Data Protection:**
- Password hashing with bcryptjs (12 rounds)
- User data isolation in database
- Minimal data exposure in shares
- Secure file handling and cleanup

**API Security:**
- Request validation and sanitization
- Rate limiting for AI operations
- Environment variable protection
- Proper error handling without data leaks

### Performance Optimization

**Caching Strategies:**
- Content-based hashing for deduplication
- Method-specific caching (basic vs AI)
- Database-level caching for repeated operations
- Response caching for identical requests

**AI Cost Management:**
- Token usage tracking and optimization
- Model selection based on operation complexity
- Intelligent fallback between providers
- Cache-first strategy to minimize API calls

**File Processing:**
- Concurrent operations for parallel processing
- Timeout management (4-minute default)
- Memory management with buffer cleanup
- Progressive image loading

### Monitoring & Analytics

**LLM Tracking:**
- Comprehensive call and message logging
- Token usage and cost calculation
- Performance metrics and processing time
- Error tracking and status monitoring

**User Analytics:**
- Usage pattern analysis
- Feature adoption metrics
- Subscription conversion tracking
- System health monitoring

---

## 🚀 Development & Deployment

### Development Setup

**Prerequisites:**
- Node.js 18+
- PostgreSQL database
- Stripe account for payments
- OpenAI and/or Anthropic API keys

**Environment Variables:**
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."
```

**Scripts:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint checking
npm run db:push      # Push schema to database
npm run db:studio    # Prisma Studio
```

### Deployment

**Vercel Configuration:**
- Optimized for Next.js deployment
- Environment variable management
- Automatic deployments from Git
- Edge function support for AI operations

**Database Migrations:**
- Prisma-based schema management
- Automatic migration generation
- Production migration strategies

**External Dependencies:**
- ImageMagick for PDF processing
- Poppler utilities for fallback
- Stripe webhooks configuration

### Testing Strategy

**Current State:**
- ESLint for code quality
- TypeScript for type safety
- Manual testing for user flows

**Recommended Additions:**
- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for critical user journeys
- Performance testing for AI operations

---

## 📝 Usage Guidelines for Chatbot Knowledge Base

### For Indexing into Pinecone

This documentation is structured to be easily indexed and searched by the AI chatbot. Each section contains:

1. **Clear Headers**: Hierarchical structure for easy navigation
2. **Code Examples**: Practical implementation details
3. **Configuration Details**: Environment variables and setup information
4. **API Specifications**: Complete endpoint documentation
5. **Feature Descriptions**: Comprehensive capability overviews

### Updating This Documentation

When adding new features to Resume Roaster:

1. **Add to Relevant Section**: Update the appropriate feature section
2. **Update API Reference**: Add new endpoints to the API table
3. **Update Database Schema**: Document new models or fields
4. **Add Component Documentation**: Document new UI components
5. **Update Table of Contents**: Ensure navigation remains accurate

### Key Information for Chatbot Responses

The chatbot can reference:
- Feature capabilities and limitations
- API endpoint specifications
- Subscription tier differences
- Technical implementation details
- Security and privacy measures
- Performance characteristics
- Troubleshooting information

---

**Last Updated**: January 30, 2025  
**Version**: 1.0  
**Maintainer**: Resume Roaster Development Team