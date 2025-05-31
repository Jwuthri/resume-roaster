#!/usr/bin/env node

/**
 * All Documentation Indexing Script for Resume Roaster
 * 
 * This script indexes all *.md files in the repository into Pinecone
 * for use by the AI chatbot knowledge base.
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { glob } = require('glob');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const INDEX_NAME = 'documents';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_CHUNK_SIZE = 1000; // tokens

if (!PINECONE_API_KEY) {
  console.error('❌ PINECONE_API_KEY environment variable is required');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Clean text content to avoid encoding issues
 */
function cleanText(text) {
  return text
    // Remove emojis and special Unicode characters
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // Remove control characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Remove surrogate pairs and other problematic Unicode
    .replace(/[\uD800-\uDFFF]/g, '')
    // Remove any remaining non-ASCII characters that might cause issues
    .replace(/[^\x00-\x7F]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Find all markdown files in the repository
 */
async function findMarkdownFiles() {
  try {
    const pattern = '**/*.md';
    const files = await glob(pattern, {
      cwd: process.cwd(),
      ignore: [
        'node_modules/**',
        '.next/**',
        '.git/**',
        'dist/**',
        'build/**'
      ]
    });
    
    // Convert to relative paths and filter out any unwanted files
    const markdownFiles = files
      .map(file => path.relative(process.cwd(), path.join(process.cwd(), file)))
      .filter(file => {
        // Additional filtering if needed
        return !file.includes('node_modules') && 
               !file.includes('.next') && 
               !file.includes('.git');
      });

    console.log(`📁 Found ${markdownFiles.length} markdown files:`, markdownFiles);
    return markdownFiles;
  } catch (error) {
    console.error('❌ Error finding markdown files:', error);
    throw error;
  }
}

/**
 * Parse the markdown documentation and create chunks
 */
function parseAndChunkDocumentation(content, fileName) {
  const chunks = [];
  const lines = content.split('\n');
  
  let currentSection = fileName; // Use filename as default section
  let currentSubsection = '';
  let currentContent = '';
  let currentTitle = fileName;
  let chunkIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect main sections (## heading)
    if (line.startsWith('## ')) {
      // Save previous chunk if it exists
      if (currentContent.trim()) {
        chunks.push(...createChunksFromContent(
          currentTitle || currentSection,
          currentContent.trim(),
          currentSection,
          currentSubsection,
          chunkIndex,
          fileName
        ));
        chunkIndex = chunks.length;
      }
      
      currentSection = cleanText(line.replace('## ', '').replace(/[🔗🏗️🔐🎯📄💳🤖🛠️🗄️🔌🎨🔒🚀📝]/g, '').trim());
      currentTitle = currentSection;
      currentContent = '';
      currentSubsection = '';
    }
    // Detect subsections (### heading)
    else if (line.startsWith('### ')) {
      // Save previous chunk if it exists
      if (currentContent.trim()) {
        chunks.push(...createChunksFromContent(
          currentTitle || currentSubsection || currentSection,
          currentContent.trim(),
          currentSection,
          currentSubsection,
          chunkIndex,
          fileName
        ));
        chunkIndex = chunks.length;
      }
      
      currentSubsection = cleanText(line.replace('### ', '').trim());
      currentTitle = currentSubsection;
      currentContent = '';
    }
    // Regular content
    else {
      currentContent += line + '\n';
    }
  }

  // Don't forget the last chunk
  if (currentContent.trim()) {
    chunks.push(...createChunksFromContent(
      currentTitle || currentSection,
      currentContent.trim(),
      currentSection,
      currentSubsection,
      chunkIndex,
      fileName
    ));
  }

  return chunks;
}

/**
 * Create chunks from content, respecting token limits
 */
function createChunksFromContent(title, content, section, subsection, startIndex, fileName) {
  const chunks = [];
  
  // Clean the content
  const cleanedContent = cleanText(content);
  const cleanedTitle = cleanText(title);
  
  const contentTokens = estimateTokens(cleanedContent);
  
  if (contentTokens <= MAX_CHUNK_SIZE) {
    // Content fits in one chunk
    chunks.push({
      id: `${fileName}-chunk-${startIndex}`,
      title: cleanedTitle,
      content: cleanedContent,
      section,
      subsection,
      chunkIndex: startIndex,
      tokenCount: contentTokens,
      fileName
    });
  } else {
    // Split content into multiple chunks
    const sentences = cleanedContent.split(/[.!?]\s+/);
    let currentChunk = '';
    let chunkCount = 0;
    
    for (const sentence of sentences) {
      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
      
      if (estimateTokens(potentialChunk) > MAX_CHUNK_SIZE && currentChunk) {
        // Save current chunk
        chunks.push({
          id: `${fileName}-chunk-${startIndex + chunkCount}`,
          title: `${cleanedTitle} (Part ${chunkCount + 1})`,
          content: currentChunk,
          section,
          subsection,
          chunkIndex: startIndex + chunkCount,
          tokenCount: estimateTokens(currentChunk),
          fileName
        });
        
        chunkCount++;
        currentChunk = sentence;
      } else {
        currentChunk = potentialChunk;
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk) {
      chunks.push({
        id: `${fileName}-chunk-${startIndex + chunkCount}`,
        title: `${cleanedTitle} (Part ${chunkCount + 1})`,
        content: currentChunk,
        section,
        subsection,
        chunkIndex: startIndex + chunkCount,
        tokenCount: estimateTokens(currentChunk),
        fileName
      });
    }
  }
  
  return chunks;
}

/**
 * Create embeddings for all chunks
 */
async function createEmbeddings(chunks) {
  const chunksWithEmbeddings = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    try {
      const embeddings = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch.map(chunk => `${chunk.title}\n\n${chunk.content}`)
      });
      
      for (let j = 0; j < batch.length; j++) {
        chunksWithEmbeddings.push({
          ...batch[j],
          embedding: embeddings.data[j].embedding
        });
      }
      
      console.log(`📊 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      
      // Small delay to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ Error creating embeddings for batch ${Math.floor(i / batchSize) + 1}:`, error);
      throw error;
    }
  }
  
  return chunksWithEmbeddings;
}

/**
 * Index a single file
 */
async function indexSingleFile(filePath, index) {
  try {
    console.log(`\n📝 Processing: ${filePath}`);
    
    // Check if file exists and is readable
    const fullPath = path.join(process.cwd(), filePath);
    try {
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        console.log(`⚠️ Skipping ${filePath}: Not a file`);
        return { success: false, reason: 'Not a file' };
      }
    } catch (error) {
      console.log(`⚠️ Skipping ${filePath}: File not accessible`);
      return { success: false, reason: 'File not accessible' };
    }

    // Read the file
    const content = fs.readFileSync(fullPath, 'utf-8');
    const fileHash = crypto.createHash('sha256').update(content).digest('hex');

    // Check if we need to re-index by looking for a metadata record
    const existingMetadata = await index.fetch([`metadata-${filePath}`]);
    if (existingMetadata.records[`metadata-${filePath}`]?.metadata?.fileHash === fileHash) {
      console.log(`📄 ${filePath} is up to date, skipping indexing`);
      return { success: true, reason: 'Up to date' };
    }

    // Parse and chunk the documentation
    const chunks = parseAndChunkDocumentation(content, filePath);
    console.log(`📝 Created ${chunks.length} chunks from ${filePath}`);

    // Create embeddings for all chunks
    const chunksWithEmbeddings = await createEmbeddings(chunks);
    console.log(`🧠 Generated embeddings for ${filePath}`);

    // Clear existing data for this file
    try {
      await index.deleteMany({
        filter: { sourceFile: { $eq: filePath } }
      });
      console.log(`🧹 Cleared existing data for ${filePath}`);
    } catch (error) {
      console.log(`ℹ️ No existing data to clear for ${filePath} (this is normal for first-time indexing)`);
    }

    // Prepare vectors for Pinecone
    const vectors = chunksWithEmbeddings.map(chunk => ({
      id: chunk.id,
      values: chunk.embedding,
      metadata: {
        title: chunk.title,
        content: chunk.content,
        section: chunk.section,
        subsection: chunk.subsection || '',
        chunkIndex: chunk.chunkIndex,
        tokenCount: chunk.tokenCount,
        sourceFile: filePath,
        fileName: chunk.fileName
      }
    }));

    // Create a metadata embedding using the file hash as content
    const metadataEmbedding = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: `Documentation metadata for ${filePath} - Hash: ${fileHash}`
    });

    // Add metadata record with proper embedding
    vectors.push({
      id: `metadata-${filePath}`,
      values: metadataEmbedding.data[0].embedding,
      metadata: {
        type: 'metadata',
        sourceFile: filePath,
        fileHash,
        totalChunks: chunks.length,
        lastIndexedAt: new Date().toISOString(),
        title: 'Documentation Metadata',
        content: `Metadata for ${filePath}`,
        section: 'metadata',
        subsection: '',
        chunkIndex: -1,
        tokenCount: 0
      }
    });

    // Upsert in batches
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(`💾 Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)} for ${filePath}`);
    }

    console.log(`✅ Successfully indexed ${filePath}`);
    return { success: true, reason: 'Indexed successfully' };
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return { success: false, reason: error.message };
  }
}

/**
 * Main indexing function
 */
async function indexAllDocumentation() {
  console.log('🔍 Starting indexing of all markdown files with Pinecone...');
  
  try {
    // Find all markdown files
    const markdownFiles = await findMarkdownFiles();
    
    if (markdownFiles.length === 0) {
      console.log('📄 No markdown files found to index');
      return;
    }

    // Get or create index
    const index = pinecone.index(INDEX_NAME);

    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Process each file
    for (const filePath of markdownFiles) {
      const result = await indexSingleFile(filePath, index);
      
      if (result.success) {
        if (result.reason === 'Up to date') {
          totalSkipped++;
        } else {
          totalProcessed++;
        }
      } else {
        totalErrors++;
      }
      
      // Small delay between files to avoid rate limits
      if (totalProcessed + totalSkipped + totalErrors < markdownFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n📊 Indexing Summary:');
    console.log(`✅ Successfully processed: ${totalProcessed} files`);
    console.log(`⚠️ Skipped (up to date): ${totalSkipped} files`);
    console.log(`❌ Errors: ${totalErrors} files`);
    console.log('🎉 All markdown files indexing completed!');
    
  } catch (error) {
    console.error('❌ Error indexing all documentation:', error);
    process.exit(1);
  }
}

// Run the indexing
indexAllDocumentation(); 