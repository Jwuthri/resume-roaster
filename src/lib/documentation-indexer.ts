import { Pinecone } from '@pinecone-database/pinecone';
import { createHash } from 'crypto';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import OpenAI from 'openai';
import { glob } from 'glob';

interface DocumentationChunk {
  id: string;
  title: string;
  content: string;
  section: string;
  subsection?: string;
  chunkIndex: number;
  tokenCount: number;
}

export class DocumentationIndexer {
  private pinecone: Pinecone;
  private openai: OpenAI;
  private readonly INDEX_NAME = 'documents';
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly MAX_CHUNK_SIZE = 1000; // tokens

  constructor() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is required for documentation indexing');
    }
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for documentation indexing');
    }

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Clean text content to avoid encoding issues
   */
  private cleanText(text: string): string {
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
   * Index the documentation file
   */
  async indexDocumentation(filePath: string = 'DOCUMENTATION.md'): Promise<void> {
    console.log('🔍 Starting documentation indexing with Pinecone...');
    
    try {
      // Read the documentation file
      const fullPath = join(process.cwd(), filePath);
      const content = readFileSync(fullPath, 'utf-8');
      const fileHash = createHash('sha256').update(content).digest('hex');

      // Get or create index
      const index = this.pinecone.index(this.INDEX_NAME);

      // Check if we need to re-index by looking for a metadata record
      const existingMetadata = await index.fetch([`metadata-${filePath}`]);
      if (existingMetadata.records[`metadata-${filePath}`]?.metadata?.fileHash === fileHash) {
        console.log('📄 Documentation is up to date, skipping indexing');
        return;
      }

      // Parse and chunk the documentation
      const chunks = this.parseAndChunkDocumentation(content);
      console.log(`📝 Created ${chunks.length} chunks from documentation`);

      // Create embeddings for all chunks
      const chunksWithEmbeddings = await this.createEmbeddings(chunks);
      console.log('🧠 Generated embeddings for all chunks');

      // Clear existing data for this file
      await this.clearExistingData(index, filePath);

      // Store in Pinecone
      await this.storeChunks(index, chunksWithEmbeddings, filePath, fileHash);
      console.log('💾 Stored chunks in Pinecone');

      console.log('✅ Documentation indexing completed successfully');
    } catch (error) {
      console.error('❌ Error indexing documentation:', error);
      throw error;
    }
  }

  /**
   * Parse the markdown documentation and create chunks
   */
  private parseAndChunkDocumentation(content: string): DocumentationChunk[] {
    const chunks: DocumentationChunk[] = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    let currentSubsection = '';
    let currentContent = '';
    let currentTitle = '';
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect main sections (## heading)
      if (line.startsWith('## ')) {
        // Save previous chunk if it exists
        if (currentContent.trim()) {
          chunks.push(...this.createChunksFromContent(
            currentTitle || currentSection,
            currentContent.trim(),
            currentSection,
            currentSubsection,
            chunkIndex
          ));
          chunkIndex = chunks.length;
        }
        
        currentSection = this.cleanText(line.replace('## ', '').replace(/[🔗🏗️🔐🎯📄💳🤖🛠️🗄️🔌🎨🔒🚀📝]/g, '').trim());
        currentTitle = currentSection;
        currentContent = '';
        currentSubsection = '';
      }
      // Detect subsections (### heading)
      else if (line.startsWith('### ')) {
        // Save previous chunk if it exists
        if (currentContent.trim()) {
          chunks.push(...this.createChunksFromContent(
            currentTitle || currentSubsection || currentSection,
            currentContent.trim(),
            currentSection,
            currentSubsection,
            chunkIndex
          ));
          chunkIndex = chunks.length;
        }
        
        currentSubsection = this.cleanText(line.replace('### ', '').trim());
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
      chunks.push(...this.createChunksFromContent(
        currentTitle || currentSection,
        currentContent.trim(),
        currentSection,
        currentSubsection,
        chunkIndex
      ));
    }

    return chunks;
  }

  /**
   * Create chunks from content, respecting token limits
   */
  private createChunksFromContent(
    title: string,
    content: string,
    section: string,
    subsection: string | undefined,
    startIndex: number
  ): DocumentationChunk[] {
    const chunks: DocumentationChunk[] = [];
    
    // Clean the content
    const cleanedContent = this.cleanText(content);
    const cleanedTitle = this.cleanText(title);
    
    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);
    
    const contentTokens = estimateTokens(cleanedContent);
    
    if (contentTokens <= this.MAX_CHUNK_SIZE) {
      // Content fits in one chunk
      chunks.push({
        id: `chunk-${startIndex}`,
        title: cleanedTitle,
        content: cleanedContent,
        section,
        subsection,
        chunkIndex: startIndex,
        tokenCount: contentTokens
      });
    } else {
      // Split content into multiple chunks
      const sentences = cleanedContent.split(/[.!?]\s+/);
      let currentChunk = '';
      let chunkCount = 0;
      
      for (const sentence of sentences) {
        const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
        
        if (estimateTokens(potentialChunk) > this.MAX_CHUNK_SIZE && currentChunk) {
          // Save current chunk
          chunks.push({
            id: `chunk-${startIndex + chunkCount}`,
            title: `${cleanedTitle} (Part ${chunkCount + 1})`,
            content: currentChunk,
            section,
            subsection,
            chunkIndex: startIndex + chunkCount,
            tokenCount: estimateTokens(currentChunk)
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
          id: `chunk-${startIndex + chunkCount}`,
          title: `${cleanedTitle} (Part ${chunkCount + 1})`,
          content: currentChunk,
          section,
          subsection,
          chunkIndex: startIndex + chunkCount,
          tokenCount: estimateTokens(currentChunk)
        });
      }
    }
    
    return chunks;
  }

  /**
   * Create embeddings for all chunks
   */
  private async createEmbeddings(chunks: DocumentationChunk[]): Promise<Array<DocumentationChunk & { embedding: number[] }>> {
    const chunksWithEmbeddings: Array<DocumentationChunk & { embedding: number[] }> = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      try {
        const embeddings = await this.openai.embeddings.create({
          model: this.EMBEDDING_MODEL,
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
   * Clear existing data for a file
   */
  private async clearExistingData(index: any, sourceFile: string): Promise<void> {
    try {
      // Delete all vectors with the sourceFile metadata
      await index.deleteMany({
        filter: { sourceFile: { $eq: sourceFile } }
      });
      console.log(`🧹 Cleared existing data for ${sourceFile}`);
    } catch (error) {
      console.log('ℹ️ No existing data to clear (this is normal for first-time indexing)');
    }
  }

  /**
   * Store chunks in Pinecone
   */
  private async storeChunks(
    index: any,
    chunks: Array<DocumentationChunk & { embedding: number[] }>,
    sourceFile: string,
    fileHash: string
  ): Promise<void> {
    // Helper function to ensure safe string values
    const safenString = (value: string | undefined): string => {
      if (!value) return '';
      return this.cleanText(value);
    };

    // Prepare vectors for Pinecone
    const vectors = chunks.map(chunk => ({
      id: chunk.id,
      values: chunk.embedding,
      metadata: {
        title: safenString(chunk.title),
        content: safenString(chunk.content),
        section: safenString(chunk.section),
        subsection: safenString(chunk.subsection),
        chunkIndex: chunk.chunkIndex,
        tokenCount: chunk.tokenCount,
        sourceFile: safenString(sourceFile)
      } as Record<string, any>
    }));

    // Create a metadata embedding using the file hash as content
    const metadataEmbedding = await this.openai.embeddings.create({
      model: this.EMBEDDING_MODEL,
      input: `Documentation metadata for ${sourceFile} - Hash: ${fileHash}`
    });

    // Add metadata record with proper embedding
    vectors.push({
      id: `metadata-${sourceFile}`,
      values: metadataEmbedding.data[0].embedding,
      metadata: {
        type: 'metadata',
        sourceFile: safenString(sourceFile),
        fileHash: safenString(fileHash),
        totalChunks: chunks.length,
        lastIndexedAt: new Date().toISOString(),
        title: 'Documentation Metadata',
        content: `Metadata for ${sourceFile}`,
        section: 'metadata',
        subsection: '',
        chunkIndex: -1,
        tokenCount: 0
      } as Record<string, any>
    });

    // Upsert in batches
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      
      try {
        await index.upsert(batch);
        console.log(`💾 Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`);
      } catch (error) {
        console.error(`❌ Error storing batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Log the problematic batch for debugging
        console.error('Problematic batch data:', JSON.stringify(batch.slice(0, 1), null, 2));
        throw error;
      }
    }
  }

  /**
   * Search for relevant documentation chunks
   */
  async searchDocumentation(query: string, limit: number = 5): Promise<Array<{
    title: string;
    content: string;
    section: string;
    subsection?: string;
    similarity: number;
  }>> {
    try {
      // Create embedding for the query
      const queryEmbedding = await this.openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: query
      });

      const index = this.pinecone.index(this.INDEX_NAME);
      
      // Search Pinecone
      const searchResults = await index.query({
        vector: queryEmbedding.data[0].embedding,
        topK: limit,
        includeMetadata: true,
        filter: {
          type: { $ne: 'metadata' } // Exclude metadata records
        }
      });

      return searchResults.matches?.map(match => ({
        title: match.metadata?.title as string || '',
        content: match.metadata?.content as string || '',
        section: match.metadata?.section as string || '',
        subsection: match.metadata?.subsection as string || undefined,
        similarity: match.score || 0
      })) || [];
    } catch (error) {
      console.error('Error searching documentation:', error);
      return [];
    }
  }

  /**
   * Get indexing status
   */
  async getIndexStatus(): Promise<{
    totalChunks: number;
    lastIndexedAt?: string;
    sections: string[];
  }> {
    try {
      const index = this.pinecone.index(this.INDEX_NAME);
      
      // Get metadata record
      const metadata = await index.fetch(['metadata-DOCUMENTATION.md']);
      const metadataRecord = metadata.records['metadata-DOCUMENTATION.md'];
      
      if (!metadataRecord) {
        return { totalChunks: 0, sections: [] };
      }

      // Get stats
      const stats = await index.describeIndexStats();
      
      return {
        totalChunks: metadataRecord.metadata?.totalChunks as number || 0,
        lastIndexedAt: metadataRecord.metadata?.lastIndexedAt as string,
        sections: [] // We could query for unique sections if needed
      };
    } catch (error) {
      console.error('Error getting index status:', error);
      return { totalChunks: 0, sections: [] };
    }
  }

  /**
   * Find all markdown files in the repository
   */
  private async findMarkdownFiles(): Promise<string[]> {
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
        .map(file => relative(process.cwd(), join(process.cwd(), file)))
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
   * Index all markdown files in the repository
   */
  async indexAllDocumentation(): Promise<void> {
    console.log('🔍 Starting indexing of all markdown files with Pinecone...');
    
    try {
      // Find all markdown files
      const markdownFiles = await this.findMarkdownFiles();
      
      if (markdownFiles.length === 0) {
        console.log('📄 No markdown files found to index');
        return;
      }

      let totalProcessed = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      // Process each file
      for (const filePath of markdownFiles) {
        try {
          console.log(`\n📝 Processing: ${filePath}`);
          
          // Check if file exists and is readable
          const fullPath = join(process.cwd(), filePath);
          try {
            const stats = statSync(fullPath);
            if (!stats.isFile()) {
              console.log(`⚠️ Skipping ${filePath}: Not a file`);
              totalSkipped++;
              continue;
            }
          } catch (error) {
            console.log(`⚠️ Skipping ${filePath}: File not accessible`);
            totalSkipped++;
            continue;
          }

          // Index the individual file
          await this.indexDocumentation(filePath);
          totalProcessed++;
          
          // Small delay between files to avoid rate limits
          if (totalProcessed < markdownFiles.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`❌ Error processing ${filePath}:`, error);
          totalErrors++;
          // Continue with other files even if one fails
        }
      }

      console.log('\n📊 Indexing Summary:');
      console.log(`✅ Successfully processed: ${totalProcessed} files`);
      console.log(`⚠️ Skipped: ${totalSkipped} files`);
      console.log(`❌ Errors: ${totalErrors} files`);
      console.log('🎉 All markdown files indexing completed!');
      
    } catch (error) {
      console.error('❌ Error indexing all documentation:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive indexing status for all files
   */
  async getAllIndexStatus(): Promise<{
    totalFiles: number;
    totalChunks: number;
    fileStatuses: Array<{
      fileName: string;
      totalChunks: number;
      lastIndexedAt?: string;
      fileHash?: string;
    }>;
  }> {
    try {
      const index = this.pinecone.index(this.INDEX_NAME);
      
      // Find all markdown files
      const markdownFiles = await this.findMarkdownFiles();
      
      // Get metadata for all files
      const metadataIds = markdownFiles.map(file => `metadata-${file}`);
      const metadata = await index.fetch(metadataIds);
      
      const fileStatuses = markdownFiles.map(file => {
        const metadataRecord = metadata.records[`metadata-${file}`];
        return {
          fileName: file,
          totalChunks: metadataRecord?.metadata?.totalChunks as number || 0,
          lastIndexedAt: metadataRecord?.metadata?.lastIndexedAt as string,
          fileHash: metadataRecord?.metadata?.fileHash as string
        };
      });

      const totalChunks = fileStatuses.reduce((sum, status) => sum + status.totalChunks, 0);
      
      return {
        totalFiles: markdownFiles.length,
        totalChunks,
        fileStatuses
      };
    } catch (error) {
      console.error('Error getting comprehensive index status:', error);
      return {
        totalFiles: 0,
        totalChunks: 0,
        fileStatuses: []
      };
    }
  }
}

// Export a singleton instance
export const documentationIndexer = new DocumentationIndexer(); 