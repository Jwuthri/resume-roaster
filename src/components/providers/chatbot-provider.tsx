'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  typing?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatbotContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  currentMessages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  startNewConversation: () => void;
  selectConversation: (conversationId: string) => void;
  isTyping: boolean;
  setIsTyping: (typing: boolean) => void;
  unreadCount: number;
  markAsRead: () => void;
  showConversationList: boolean;
  setShowConversationList: (show: boolean) => void;
  isLoading: boolean;
  refreshConversations: () => Promise<void>;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}

interface ChatbotProviderProps {
  children: ReactNode;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  content: "👋 Welcome to Resume Roaster!\n\nI'm your AI-powered resume assistant. I can help you with:\n\n• Resume optimization tips\n• ATS-friendly formatting\n• Section improvements\n• Keyword strategies\n• Best practices\n\nWhat would you like to work on today?",
  sender: 'bot',
  timestamp: new Date(),
};

// Helper function to generate UUID in browser
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for browsers that don't support crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to get or create session token for anonymous users
function getSessionToken(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionToken = localStorage.getItem('chatbot-session-token');
  if (!sessionToken) {
    sessionToken = generateUUID();
    localStorage.setItem('chatbot-session-token', sessionToken);
  }
  return sessionToken;
}

// Helper function to clear session token (when user logs in)
function clearSessionToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('chatbot-session-token');
  }
}

// Helper function to create headers with session token
function createApiHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add session token for anonymous users
  if (typeof window !== 'undefined') {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      headers['x-session-token'] = sessionToken;
    }
  }
  
  return headers;
}

export function ChatbotProvider({ children }: ChatbotProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showConversationList, setShowConversationList] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  const currentMessages = currentConversationId 
    ? conversations.find(c => c.id === currentConversationId)?.messages || []
    : [WELCOME_MESSAGE];

  // Clear anonymous session token when user logs in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      clearSessionToken();
      // Refresh conversations to load user's actual conversations
      refreshConversations();
    }
  }, [status, session?.user]);

  // Load conversations on mount
  useEffect(() => {
    refreshConversations();
  }, []);

  const refreshConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chatbot', {
        headers: createApiHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        
        // Update session token if provided in response (for anonymous users)
        const newSessionToken = response.headers.get('x-session-token');
        if (newSessionToken && typeof window !== 'undefined' && !session?.user) {
          localStorage.setItem('chatbot-session-token', newSessionToken);
        }
        
        setConversations(data.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        })));
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (message.sender === 'user') {
      // For user messages, send to API and let it handle the conversation creation/update
      try {
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: createApiHeaders(),
          body: JSON.stringify({ 
            message: message.content,
            conversationId: currentConversationId 
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update session token if provided in response (for anonymous users)
          const newSessionToken = response.headers.get('x-session-token');
          if (newSessionToken && typeof window !== 'undefined' && !session?.user) {
            localStorage.setItem('chatbot-session-token', newSessionToken);
          }
          
          // If this was a new conversation, update the current conversation ID
          if (!currentConversationId) {
            setCurrentConversationId(data.conversationId);
            setShowConversationList(false);
          }
          
          // Refresh conversations to get the latest data
          await refreshConversations();
        } else {
          throw new Error('Failed to send message');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Add error message locally
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: "I apologize, but I'm having trouble responding right now. Please try again in a moment!",
          sender: 'bot',
          timestamp: new Date(),
        };
        
        // Update local state for immediate feedback
        if (currentConversationId) {
          setConversations(prev => prev.map(conv => 
            conv.id === currentConversationId 
              ? { 
                  ...conv, 
                  messages: [...conv.messages, errorMessage],
                  updatedAt: new Date()
                }
              : conv
          ));
        }
      }
    } else {
      // For bot messages (shouldn't happen in normal flow, but keeping for compatibility)
      const newMessage: Message = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date(),
      };

      if (currentConversationId) {
        setConversations(prev => prev.map(conv => 
          conv.id === currentConversationId 
            ? { 
                ...conv, 
                messages: [...conv.messages, newMessage],
                updatedAt: new Date()
              }
            : conv
        ));
      }

      if (message.sender === 'bot') {
        setUnreadCount(prev => prev + 1);
      }
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setShowConversationList(true);
    setUnreadCount(0);
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setShowConversationList(false);
    setUnreadCount(0);
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  return (
    <ChatbotContext.Provider
      value={{
        conversations,
        currentConversationId,
        setCurrentConversationId,
        currentMessages,
        addMessage,
        startNewConversation,
        selectConversation,
        isTyping,
        setIsTyping,
        unreadCount,
        markAsRead,
        showConversationList,
        setShowConversationList,
        isLoading,
        refreshConversations,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
} 