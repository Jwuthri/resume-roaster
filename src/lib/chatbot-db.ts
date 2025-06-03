import { PrismaClient } from '@/generated/prisma';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface ChatbotMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatbotConversation {
  id: string;
  title: string;
  messages: ChatbotMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export async function createChatbotConversation(
  userId: string | null,
  title: string,
  firstMessage: string
): Promise<ChatbotConversation> {
  // Generate a unique conversation ID
  const conversationId = crypto.randomUUID();
  
  console.log('=== CHATBOT DB CREATE CONVERSATION DEBUG ===');
  console.log('Input userId:', userId);
  console.log('Is userId null?', userId === null);
  console.log('Does userId start with anon_?', userId?.startsWith('anon_'));
  
  // Determine if this is an anonymous user
  // Anonymous users have userId starting with 'anon_' OR userId is null
  const isAnonymous = !userId || userId.startsWith('anon_');
  const validUserId = isAnonymous ? null : userId;
  const anonymousId = isAnonymous ? userId : null;
  
  console.log('Determined isAnonymous:', isAnonymous);
  console.log('Setting validUserId to:', validUserId);
  console.log('Setting anonymousId to:', anonymousId);
  
  // Create the first message in the conversation
  const message = await prisma.chatbot.create({
    data: {
      userId: validUserId,
      anonymousId: anonymousId,
      conversationId: conversationId,
      message: firstMessage,
      role: 'user'
    }
  });

  console.log('Created message with userId:', message.userId, 'anonymousId:', message.anonymousId);

  return {
    id: conversationId,
    title: title,
    messages: [{
      id: message.id,
      content: message.message,
      sender: 'user',
      timestamp: message.createdAt,
    }],
    createdAt: message.createdAt,
    updatedAt: message.createdAt,
  };
}

export async function addMessageToConversation(
  conversationId: string,
  content: string,
  role: 'user' | 'assistant'
): Promise<ChatbotMessage> {
  // Get the user/anonymous info from the conversation
  const existingMessage = await prisma.chatbot.findFirst({
    where: { conversationId },
    select: { userId: true, anonymousId: true }
  });

  if (!existingMessage) {
    throw new Error('Conversation not found');
  }

  const message = await prisma.chatbot.create({
    data: {
      userId: existingMessage.userId,
      anonymousId: existingMessage.anonymousId,
      conversationId: conversationId,
      message: content,
      role: role
    }
  });

  return {
    id: message.id,
    content: message.message,
    sender: role === 'user' ? 'user' : 'bot',
    timestamp: message.createdAt,
  };
}

export async function getChatbotConversations(
  userId: string | null
): Promise<ChatbotConversation[]> {
  console.log('=== CHATBOT DB GET CONVERSATIONS DEBUG ===');
  console.log('Input userId:', userId);
  
  // Determine if this is an anonymous user
  // Anonymous users have userId starting with 'anon_' OR userId is null
  const isAnonymous = !userId || userId.startsWith('anon_');
  const validUserId = isAnonymous ? null : userId;
  const anonymousId = isAnonymous ? userId : null;

  console.log('Determined isAnonymous:', isAnonymous);
  console.log('Using validUserId:', validUserId);
  console.log('Using anonymousId:', anonymousId);

  // Build the where clause
  const whereClause = isAnonymous 
    ? { anonymousId: anonymousId }
    : { userId: validUserId };

  console.log('Where clause:', whereClause);

  // Get all messages for this user/anonymous user
  const messages = await prisma.chatbot.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' }
  });

  // Group messages by conversation ID
  const conversationMap = new Map<string, ChatbotMessage[]>();
  const conversationMetadata = new Map<string, { createdAt: Date; updatedAt: Date }>();

  for (const message of messages) {
    if (!conversationMap.has(message.conversationId)) {
      conversationMap.set(message.conversationId, []);
      conversationMetadata.set(message.conversationId, {
        createdAt: message.createdAt,
        updatedAt: message.createdAt
      });
    }

    conversationMap.get(message.conversationId)!.push({
      id: message.id,
      content: message.message,
      sender: message.role === 'user' ? 'user' : 'bot',
      timestamp: message.createdAt,
    });

    // Update the conversation's last updated time
    const metadata = conversationMetadata.get(message.conversationId)!;
    if (message.createdAt > metadata.updatedAt) {
      metadata.updatedAt = message.createdAt;
    }
  }

  // Convert to conversation objects
  const conversations: ChatbotConversation[] = [];
  for (const [conversationId, messages] of conversationMap.entries()) {
    const metadata = conversationMetadata.get(conversationId)!;
    const firstMessage = messages[0];
    const title = firstMessage ? 
      (firstMessage.content.split(' ').slice(0, 6).join(' ') + 
       (firstMessage.content.split(' ').length > 6 ? '...' : '')) :
      'Chatbot Conversation';

    conversations.push({
      id: conversationId,
      title: title,
      messages: messages,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    });
  }

  // Sort by most recent first
  return conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getChatbotConversation(
  conversationId: string,
  userId: string | null
): Promise<ChatbotConversation | null> {
  console.log('=== CHATBOT DB GET CONVERSATION DEBUG ===');
  console.log('Input conversationId:', conversationId);
  console.log('Input userId:', userId);
  
  // Determine if this is an anonymous user
  // Anonymous users have userId starting with 'anon_' OR userId is null
  const isAnonymous = !userId || userId.startsWith('anon_');
  const validUserId = isAnonymous ? null : userId;
  const anonymousId = isAnonymous ? userId : null;

  console.log('Determined isAnonymous:', isAnonymous);
  console.log('Using validUserId:', validUserId);
  console.log('Using anonymousId:', anonymousId);

  // Build the where clause
  const whereClause = isAnonymous 
    ? { conversationId, anonymousId: anonymousId }
    : { conversationId, userId: validUserId };

  console.log('Where clause:', whereClause);

  // Get all messages for this conversation
  const messages = await prisma.chatbot.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' }
  });

  if (messages.length === 0) {
    return null;
  }

  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const title = firstMessage.message.split(' ').slice(0, 6).join(' ') + 
                (firstMessage.message.split(' ').length > 6 ? '...' : '');

  return {
    id: conversationId,
    title: title,
    messages: messages.map(msg => ({
      id: msg.id,
      content: msg.message,
      sender: msg.role === 'user' ? 'user' : 'bot',
      timestamp: msg.createdAt,
    })),
    createdAt: firstMessage.createdAt,
    updatedAt: lastMessage.createdAt,
  };
} 