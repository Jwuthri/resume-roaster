#!/usr/bin/env node

/**
 * Cleanup script for orphaned chatbot conversations
 * 
 * This script handles existing conversations that have userId: null
 * which were created before the session isolation fix.
 * 
 * Options:
 * 1. Delete all orphaned conversations
 * 2. Keep recent orphaned conversations (last 7 days)
 * 3. Migrate to a special "legacy" user ID
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Analyzing orphaned chatbot conversations...');
  
  // Find all orphaned conversations (userId: null, operationType: 'chatbot_support')
  const orphanedConversations = await prisma.llmCall.findMany({
    where: {
      userId: null,
      operationType: 'chatbot_support'
    },
    include: {
      messages: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`📊 Found ${orphanedConversations.length} orphaned conversations`);

  if (orphanedConversations.length === 0) {
    console.log('✅ No orphaned conversations found. Nothing to clean up.');
    return;
  }

  // Analyze the conversations
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const recentOrphaned = orphanedConversations.filter(conv => conv.createdAt > sevenDaysAgo);
  const oldOrphaned = orphanedConversations.filter(conv => conv.createdAt <= sevenDaysAgo);

  console.log(`📅 Recent conversations (last 7 days): ${recentOrphaned.length}`);
  console.log(`🗓️  Old conversations (older than 7 days): ${oldOrphaned.length}`);

  // Get user input for cleanup strategy
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('\n🛠️  Cleanup options:');
  console.log('1. Delete all orphaned conversations');
  console.log('2. Delete only old conversations (keep recent ones)');
  console.log('3. Migrate to legacy anonymous user ID');
  console.log('4. Exit without changes');

  const choice = await question('\nEnter your choice (1-4): ');

  switch (choice) {
    case '1':
      await deleteAllOrphaned(orphanedConversations);
      break;
    case '2':
      await deleteOldOrphaned(oldOrphaned);
      break;
    case '3':
      await migrateToLegacy(orphanedConversations);
      break;
    case '4':
      console.log('👋 Exiting without changes.');
      break;
    default:
      console.log('❌ Invalid choice. Exiting.');
  }

  rl.close();
}

async function deleteAllOrphaned(conversations) {
  console.log(`🗑️  Deleting ${conversations.length} orphaned conversations...`);
  
  const conversationIds = conversations.map(conv => conv.id);
  
  // Delete messages first (due to foreign key constraints)
  const deletedMessages = await prisma.llmMessage.deleteMany({
    where: {
      llmCallId: {
        in: conversationIds
      }
    }
  });

  // Delete conversations
  const deletedConversations = await prisma.llmCall.deleteMany({
    where: {
      id: {
        in: conversationIds
      }
    }
  });

  console.log(`✅ Deleted ${deletedMessages.count} messages and ${deletedConversations.count} conversations`);
}

async function deleteOldOrphaned(oldConversations) {
  console.log(`🗑️  Deleting ${oldConversations.length} old orphaned conversations...`);
  
  const conversationIds = oldConversations.map(conv => conv.id);
  
  if (conversationIds.length === 0) {
    console.log('✅ No old conversations to delete.');
    return;
  }
  
  // Delete messages first
  const deletedMessages = await prisma.llmMessage.deleteMany({
    where: {
      llmCallId: {
        in: conversationIds
      }
    }
  });

  // Delete conversations
  const deletedConversations = await prisma.llmCall.deleteMany({
    where: {
      id: {
        in: conversationIds
      }
    }
  });

  console.log(`✅ Deleted ${deletedMessages.count} messages and ${deletedConversations.count} old conversations`);
}

async function migrateToLegacy(conversations) {
  console.log(`🔄 Migrating ${conversations.length} orphaned conversations to legacy user ID...`);
  
  const legacyUserId = 'legacy_anonymous_user';
  
  const updated = await prisma.llmCall.updateMany({
    where: {
      userId: null,
      operationType: 'chatbot_support'
    },
    data: {
      userId: legacyUserId
    }
  });

  console.log(`✅ Migrated ${updated.count} conversations to legacy user ID: ${legacyUserId}`);
  console.log('ℹ️  These conversations will no longer be accessible to new anonymous users.');
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 