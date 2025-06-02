import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { callOpenAIText, OPENAI_MODELS, CONTEXT_SIZES, TEMPERATURES } from '@/lib/openai-utils';
import { 
  createChatbotConversation, 
  addMessageToConversation, 
  getChatbotConversations,
  getChatbotConversation 
} from '@/lib/chatbot-db';
import { documentationIndexer } from '@/lib/documentation-indexer';
import crypto from 'crypto';

interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
}

const SYSTEM_PROMPT = `You are a professional resume and career advisor assistant for Resume Roaster, an AI-powered resume optimization platform. Your role is to help users create outstanding resumes and advance their careers.

IMPORTANT: You must ONLY answer questions related to:
- Resume Roaster platform features and functionality
- Resume writing, formatting, and optimization
- ATS (Applicant Tracking System) optimization
- Career advancement and job search strategies
- Cover letter guidance
- LinkedIn profile optimization
- Interview preparation
- Career transition strategies
- Pricing and subscription information for Resume Roaster
- Technical support for using Resume Roaster

If a user asks about topics unrelated to resumes, careers, job searching, or Resume Roaster's services, politely decline and redirect them back to resume and career-related topics.

Key guidelines:
- Provide specific, actionable advice about resume writing, formatting, and optimization
- Help with ATS (Applicant Tracking System) optimization
- Offer career advancement tips and job search strategies
- Be encouraging and supportive while maintaining professionalism
- Keep responses concise but comprehensive (2-4 sentences typically)
- Focus on modern resume best practices and current hiring trends
- When discussing specific sections, provide concrete examples
- Always prioritize practical, implementable advice
- If asked about unrelated topics, respond with: "I'm specifically designed to help with resume optimization and career advice. Let me know how I can help you improve your resume or advance your career instead!"

Areas of expertise:
- Resume structure and formatting
- ATS optimization techniques
- Industry-specific resume advice
- Cover letter guidance
- LinkedIn profile optimization
- Interview preparation
- Career transition strategies
- Skills highlighting and quantifying achievements
- Resume Roaster platform features and capabilities

When you have access to relevant documentation about Resume Roaster's features and capabilities, use that information to provide accurate, up-to-date guidance about the platform's functionality.

Respond in a friendly, professional tone that builds confidence while providing valuable insights.`;

async function generateAIResponse(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Search for relevant documentation
    const relevantDocs = await documentationIndexer.searchDocumentation(userMessage, 50);
    
    // Prepare conversation history for context
    let contextPrompt = userMessage;
    
    // Add relevant documentation context if found
    if (relevantDocs.length > 0) {
      const docContext = relevantDocs
        .map(doc => `**${doc.section}${doc.subsection ? ` - ${doc.subsection}` : ''}**:\n${doc.content}`)
        .join('\n\n');
      
      contextPrompt = `RELEVANT DOCUMENTATION:\n${docContext}\n\n---\n\nUser Question: ${userMessage}`;
    }
    
    // Add recent conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-6);
    if (recentHistory.length > 0) {
      const historyText = recentHistory.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      
      contextPrompt = `Previous conversation:\n${historyText}\n\n${contextPrompt}`;
    }

    const response = await callOpenAIText(contextPrompt, {
      model: OPENAI_MODELS.NANO,
      maxTokens: CONTEXT_SIZES.MINI,
      temperature: TEMPERATURES.NORMAL,
      systemPrompt: SYSTEM_PROMPT
    });

    return response.data || 'I apologize, but I encountered an issue generating a response. Please try asking your question again.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback response
    return "I'm experiencing some technical difficulties right now. In the meantime, here's a quick tip: Focus on quantifying your achievements with specific numbers and metrics in your resume - it makes a huge difference to recruiters!";
  }
}

function generateConversationTitle(message: string): string {
  const words = message.split(' ').slice(0, 6);
  return words.join(' ') + (message.split(' ').length > 6 ? '...' : '');
}

// Helper function to generate anonymous user identifier
function generateAnonymousUserId(request: NextRequest): string {
  // Get IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  
  // Get or generate session token from headers
  const sessionToken = request.headers.get('x-session-token') || crypto.randomUUID();
  
  // Create a unique identifier combining IP and session token
  const anonymousId = `anon_${crypto.createHash('sha256').update(`${ip}_${sessionToken}`).digest('hex').substring(0, 16)}`;
  
  return anonymousId;
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get user session (for authenticated users)
    const session = await getServerSession();
    let userId = session?.user?.id || null;
    
    // For anonymous users, generate a unique identifier
    if (!userId) {
      userId = generateAnonymousUserId(request);
    }

    let currentConversationId = conversationId;
    let conversationHistory: ChatMessage[] = [];

    // If no conversation ID, create a new conversation
    if (!currentConversationId) {
      const title = generateConversationTitle(message);
      const conversation = await createChatbotConversation(userId, title, message);
      currentConversationId = conversation.id;
    } else {
      // Add user message to existing conversation and get history
      await addMessageToConversation(currentConversationId, message, 'user');
      
      // Get conversation history for context
      const conversation = await getChatbotConversation(currentConversationId, userId);
      if (conversation) {
        conversationHistory = conversation.messages.map(msg => ({
          content: msg.content,
          sender: msg.sender
        }));
      }
    }

    // Generate AI response
    const response = await generateAIResponse(message, conversationHistory);
    
    // Add bot response to conversation
    const botMessage = await addMessageToConversation(currentConversationId, response, 'assistant');
    
    // Generate session token for anonymous users to include in response
    const responseHeaders: Record<string, string> = {};
    if (!session?.user?.id) {
      const sessionToken = request.headers.get('x-session-token') || crypto.randomUUID();
      responseHeaders['x-session-token'] = sessionToken;
    }
    
    return NextResponse.json({
      response: botMessage.content,
      conversationId: currentConversationId,
      timestamp: botMessage.timestamp.toISOString(),
    }, {
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Chatbot POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get conversations or specific conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    // Get user session
    const session = await getServerSession();
    let userId = session?.user?.id || null;
    
    // For anonymous users, generate the same unique identifier
    if (!userId) {
      userId = generateAnonymousUserId(request);
    }

    if (conversationId) {
      // Get specific conversation
      const conversation = await getChatbotConversation(conversationId, userId);
      
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ conversation });
    } else {
      // Get all conversations for user
      const conversations = await getChatbotConversations(userId);
      
      // Generate session token for anonymous users to include in response
      const responseHeaders: Record<string, string> = {};
      if (!session?.user?.id) {
        const sessionToken = request.headers.get('x-session-token') || crypto.randomUUID();
        responseHeaders['x-session-token'] = sessionToken;
      }
      
      return NextResponse.json({ conversations }, {
        headers: responseHeaders
      });
    }
    
  } catch (error) {
    console.error('Chatbot GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 