# PDF Extraction System

## Overview

The Resume Roaster application supports multiple PDF extraction methods, ranging from basic text extraction to advanced AI-powered processing with **vision capabilities**. This system provides users with different tiers of extraction quality and cost.

## 🚀 **PRODUCTION FIX: Serverless PDF to Image Conversion**

### Issue Resolved
The PDF to image conversion was failing in production (Vercel) because it relied on system tools (`ImageMagick` and `poppler-utils`) that are not available in serverless environments.

### Solution Implemented
- **Serverless-Compatible Conversion**: Added `pdfjs-dist` + `canvas` based conversion for production
- **Environment Detection**: Automatically detects serverless vs local environments
- **Graceful Fallback**: Falls back to system tools in local development, serverless method in production
- **Error Handling**: Continues without images if conversion fails (maintains functionality)

### Technical Details
```typescript
// Automatic environment detection
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY

// Serverless conversion using pdfjs-dist + canvas
const pdfjsLib = await import('pdfjs-dist')
const { createCanvas } = await import('canvas')
```

### Configuration Updates
- **Next.js Config**: Added `canvas` and `pdfjs-dist` to `serverExternalPackages`
- **Vercel Functions**: Configured with sufficient memory (1024MB) and timeout (800s)
- **Dependencies**: Leverages existing `pdfjs-dist` and `canvas` packages

## Extraction Methods

### 1. Basic PDF Extraction (Free)
- **Technology**: node-poppler + pdf-parse fallback
- **Processing Time**: 5-10 seconds
- **Cost**: Free (0 credits)
- **Output**: Raw text extraction with basic formatting
- **Best For**: Quick text extraction, budget-conscious users

### 2. OpenAI Nano AI Extraction (1 Credit)
- **Technology**: OpenAI Nano with basic PDF text extraction + AI formatting
- **Processing Time**: 8-15 seconds
- **Cost**: 1 credit (~$0.01-0.02)
- **Output**: AI-formatted markdown with basic structure
- **Best For**: Budget-friendly AI enhancement, simple resumes

### 3. OpenAI Mini AI Extraction (2 Credits)
- **Technology**: OpenAI Mini with **vision-capable PDF processing** or text extraction + AI formatting
- **Processing Time**: 10-20 seconds
- **Cost**: 2 credits (~$0.02-0.05)
- **Output**: AI-formatted markdown with smart structure
- **Best For**: Budget-conscious users, good formatting, faster AI processing
- **Vision Support**: ✅ **Processes PDF images directly when available**

### 4. Claude Sonnet 4 AI Extraction (3 Credits)
- **Technology**: Anthropic Claude Sonnet 4 with **direct PDF image processing**
- **Processing Time**: 15-30 seconds
- **Cost**: 3 credits (~$0.06-0.15)
- **Output**: Superior formatted markdown with highest accuracy
- **Best For**: Complex resumes, highest quality, direct PDF processing
- **Vision Support**: ✅ **Advanced vision capabilities for complex layouts**

### 5. Claude Opus 4 AI Extraction (4 Credits)
- **Technology**: Anthropic Claude Opus 4 with **direct PDF image processing**
- **Processing Time**: 20-40 seconds
- **Cost**: 4 credits (~$0.12-0.30)
- **Output**: Ultimate formatted markdown with maximum accuracy
- **Best For**: Most complex resumes, ultimate quality, advanced reasoning
- **Vision Support**: ✅ **Premium vision processing for complex documents**

## 🔥 **Vision-Based PDF Processing**

### How It Works

The system now intelligently chooses between two extraction methods:

1. **Vision Mode** (When PDF images are available):
   - Converts PDF pages to high-resolution images using **serverless-compatible** conversion
   - Sends images directly to vision-capable AI models
   - Preserves visual formatting, layout, and design elements
   - Better handling of complex layouts, tables, and graphics
   - More accurate text extraction from styled documents

2. **Text Mode** (Fallback when images unavailable):
   - Uses traditional text extraction methods
   - Processes extracted text with AI for formatting
   - Maintains backward compatibility

### Vision Advantages

- **Layout Preservation**: Maintains original document structure and formatting
- **Complex Documents**: Better handling of multi-column layouts, tables, and graphics
- **Visual Elements**: Can interpret charts, logos, and design elements
- **Accuracy**: Higher text extraction accuracy, especially for styled documents
- **Context**: Understands visual hierarchy and document flow

### Technical Implementation

```typescript
// Environment-aware PDF to image conversion
export async function convertPDFToImages(pdfBuffer: Buffer): Promise<string[]> {
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
  
  if (isServerless) {
    // Use pdfjs-dist + canvas for serverless environments
    return await convertPDFToImagesServerless(pdfBuffer)
  } else {
    // Use system tools in local development
    return await convertPDFToImagesSystem(pdfBuffer)
  }
}

// Vision-capable extraction (Anthropic)
const response = await callAnthropicPDFExtractionWithVision(prompt, pdfImages, {
  model: ANTHROPIC_MODELS.SONNET,
  maxTokens: ANTHROPIC_CONTEXT_SIZES.NORMAL,
  temperature: ANTHROPIC_TEMPERATURES.LOW,
  systemPrompt: 'Extract resume content from PDF images...'
})

// Vision-capable extraction (OpenAI)
const response = await callOpenAIPDFExtractionWithVision(prompt, pdfImages, {
  model: OPENAI_MODELS.MINI,
  maxTokens: CONTEXT_SIZES.NORMAL,
  temperature: TEMPERATURES.LOW,
  systemPrompt: 'Extract resume content from PDF images...'
})
```

## API Endpoints

### `/api/extract-pdf-ai`
Main endpoint that handles basic and all AI extraction methods based on user status and preferences.

**Parameters:**
- `file`: PDF file to extract
- `userId`: Optional user ID for registered users
- `extractionMethod`: `'basic'`, `'ai'`, or `'auto'` (default: `'auto'`)
- `provider`: AI provider - `'anthropic'` (Claude models) or `'openai'` (OpenAI models)
- `model`: Specific model - `'nano'`, `'mini'`, `'sonnet'`, or `'opus'`

**Response includes:**
- `extractionMethod`: `'vision'`, `'text'`, or `'basic'`
- `hasImages`: Boolean indicating if PDF images were generated
- `imageCount`: Number of PDF pages converted to images
- `data`: Extracted content with enhanced structure when using vision

**Logic:**
- Non-registered users: Always use basic extraction
- Registered users: Respect `extractionMethod`, `provider`, and `model` parameters
- **Vision Processing**: Automatically uses vision when PDF images are available
- **Environment Detection**: Uses appropriate conversion method based on deployment environment
- Caching: Results are cached by file hash to avoid reprocessing

### `/api/extract-pdf-basic`
Dedicated endpoint for basic PDF extraction (legacy support).

## Implementation Details

### Vision Processing Pipeline
1. **PDF to Images**: Convert PDF pages to high-resolution PNG images (up to 3 pages)
   - **Production**: Uses `pdfjs-dist` + `canvas` (serverless-compatible)
   - **Development**: Uses `ImageMagick` or `poppler-utils` with fallback to serverless method
2. **Image Optimization**: Resize and optimize images for AI processing
3. **Vision Analysis**: Send images to vision-capable AI models
4. **Content Extraction**: Extract text, structure, and formatting information
5. **Markdown Generation**: Convert to clean, professional markdown

### Basic Extraction Process
1. **Primary Method**: `node-poppler` - Most reliable for PDF text extraction
2. **Fallback Method**: `pdf-parse/lib/pdf-parse` - Direct lib import to avoid bundling issues
3. **Final Fallback**: Meaningful placeholder with file metadata

### AI Enhancement Process

#### Claude Models (Anthropic) - **Vision Capable**
1. **Direct PDF Image Processing**: Send PDF images directly to Claude models
2. **Advanced Layout Understanding**: Interprets visual structure and formatting
3. **Structured Output**: JSON response with markdown, summary, and detailed sections
4. **Fallback Parsing**: Handle cases where JSON parsing fails

#### OpenAI Models - **Vision Capable**
1. **Dual Processing**: Vision mode for images, text mode for fallback
2. **High-Detail Analysis**: Uses 'high' detail setting for better text extraction
3. **AI Enhancement**: OpenAI models format and structure the extracted content
4. **Cost Efficient**: Multiple tiers for different quality/cost needs

### Credit System
- **Basic Extraction**: 0 credits (free)
- **OpenAI Nano**: 1 credit per extraction
- **OpenAI Mini**: 2 credits per extraction (✅ **Vision Capable**)
- **Claude Sonnet 4**: 3 credits per extraction (✅ **Vision Capable**)
- **Claude Opus 4**: 4 credits per extraction (✅ **Vision Capable**)

### File Handling
- **Image Generation**: PDF pages converted to PNG images (up to 3 pages)
- **Serverless Compatibility**: Uses JavaScript-based conversion in production
- **Temporary Files**: Created in system temp directory for processing (local only)
- **Cleanup**: Automatic cleanup of temporary files and images
- **Security**: Files are processed locally and cleaned up immediately

## Frontend Integration

### ExtractionMethodSelector Component
- **Non-registered users**: Shows information about basic extraction and signup benefits
- **Registered users**: Interactive selection between basic and AI extraction with model choice
- **Visual feedback**: Clear indication of processing time, cost, output quality, and **vision capabilities** for each tier
- **Vision Indicator**: Shows when vision processing is available/used

### Updated File Upload Flow
1. **File Selection**: User selects PDF file
2. **Method Selection**: Registered users choose extraction method and model (PDF files only)
3. **Vision Processing**: System automatically uses vision when available
4. **Processing**: Extraction occurs based on selected method and capabilities
5. **Results**: Display extracted content with method indicator (Vision/Text/Basic)

## Dependencies

### Core Dependencies
```json
{
  "pdf-parse": "^1.1.1",
  "node-poppler": "^8.0.1",
  "pdfjs-dist": "^4.10.38",
  "canvas": "^3.1.0",
  "@types/pdf-parse": "^1.1.1",
  "@types/pdfjs-dist": "^2.10.377"
}
```

### System Requirements
- **Local Development**: 
  - **node-poppler**: Requires poppler-utils to be installed on the system
  - **ImageMagick** or **poppler-utils**: For PDF to image conversion
- **Production (Serverless)**:
  - **pdfjs-dist**: JavaScript-based PDF processing
  - **canvas**: Node.js canvas implementation for image generation
- **Vision-capable AI models**: Claude 3.5+, Claude 4, OpenAI GPT-4 Vision

## Performance Considerations

### Vision Mode
- **Higher Token Usage**: Images consume more tokens than text
- **Better Accuracy**: Significantly improved extraction quality
- **Processing Time**: Slightly longer due to image processing
- **Cost**: Higher due to vision model usage, but better value for complex documents

### Optimization
- **Image Compression**: Automatic optimization for AI processing
- **Page Limits**: Maximum 3 pages to control costs
- **Caching**: Aggressive caching to avoid reprocessing
- **Fallback**: Graceful degradation to text mode when vision fails
- **Environment Detection**: Uses optimal conversion method for each environment

## Testing

### Local Testing
```bash
# Test PDF extraction modules
npm run test-pdf

# Test PDF to image conversion
npm run test-pdf-images
```

### Production Testing
1. Deploy to Vercel
2. Upload a PDF file through the UI
3. Check browser console for conversion logs
4. Verify images appear in the PDF preview

## Best Practices

1. **Use Vision for Complex Documents**: Tables, multi-column layouts, styled resumes
2. **Text Mode for Simple Documents**: Plain text resumes work well with text extraction
3. **Monitor Costs**: Vision processing uses more tokens
4. **Cache Results**: Leverage caching to avoid repeated processing
5. **Quality vs Cost**: Choose appropriate tier based on document complexity
6. **Environment Awareness**: The system automatically adapts to deployment environment

## Troubleshooting

### Production Issues
- **No PDF Images**: Check Vercel function logs for conversion errors
- **Canvas Errors**: Ensure `canvas` is in `serverExternalPackages` in `next.config.ts`
- **Memory Issues**: Increase Vercel function memory allocation if needed
- **Timeout Issues**: Check function timeout settings in `vercel.json`

### Local Development Issues
- **System Tools Missing**: Install ImageMagick or poppler-utils
- **Module Import Errors**: Run `npm run test-pdf-images` to diagnose
- **Canvas Installation**: May require system dependencies on some platforms

## Future Enhancements

- **Multi-page Support**: Extend beyond 3-page limit
- **Document Type Detection**: Automatic method selection based on document complexity
- **Batch Processing**: Process multiple documents efficiently
- **Advanced Vision Features**: Table extraction, chart interpretation, logo recognition
- **Performance Optimization**: Further optimize serverless conversion speed 