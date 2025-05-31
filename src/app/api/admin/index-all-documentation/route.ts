import { NextRequest, NextResponse } from 'next/server';
import { documentationIndexer } from '@/lib/documentation-indexer';

export async function POST(request: NextRequest) {
  try {
    console.log('📚 Starting indexing of all markdown files...');
    await documentationIndexer.indexAllDocumentation();
    
    return NextResponse.json({
      success: true,
      message: 'All markdown files indexed successfully'
    });
  } catch (error) {
    console.error('❌ Error indexing all documentation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = await documentationIndexer.getAllIndexStatus();
    
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('❌ Error getting all index status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        totalFiles: 0,
        totalChunks: 0,
        fileStatuses: []
      },
      { status: 500 }
    );
  }
} 