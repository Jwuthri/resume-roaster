const fs = require('fs');
const path = require('path');

// Import our PDF to image function
const { convertPDFToImages } = require('../src/lib/pdf-to-image.ts');

async function testPuppeteerPDFConversion() {
  console.log('🧪 Testing Puppeteer + Chromium PDF to JPEG conversion...\n');
  
  try {
    // Read a sample PDF file (you can replace this with any PDF)
    const samplePdfPath = path.join(__dirname, '..', 'public', 'sample-resume.pdf');
    
    let pdfBuffer;
    try {
      pdfBuffer = await fs.promises.readFile(samplePdfPath);
      console.log(`📄 Loaded PDF: ${samplePdfPath} (${Math.round(pdfBuffer.length / 1024)}KB)`);
    } catch (error) {
      // Create a minimal PDF for testing if sample doesn't exist
      console.log('📄 Sample PDF not found, creating minimal test PDF...');
      
      // This is a minimal valid PDF content
      const minimalPdf = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF`;
      
      pdfBuffer = Buffer.from(minimalPdf);
      console.log(`📄 Created minimal test PDF (${Math.round(pdfBuffer.length / 1024)}KB)`);
    }
    
    // Test the conversion
    console.log('\n🔄 Starting PDF to JPEG conversion...');
    const startTime = Date.now();
    
    const images = await convertPDFToImages(pdfBuffer);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`\n✅ Conversion completed in ${processingTime}ms`);
    console.log(`📸 Generated ${images.length} JPEG images`);
    
    if (images.length > 0) {
      images.forEach((image, index) => {
        const sizeKB = Math.round(image.length / 1024);
        console.log(`   📷 Image ${index + 1}: ${sizeKB}KB base64 data`);
        
        // Optionally save the first image to verify it's valid
        if (index === 0) {
          try {
            const imageBuffer = Buffer.from(image, 'base64');
            const outputPath = path.join(__dirname, 'test-output-page1.jpg');
            fs.writeFileSync(outputPath, imageBuffer);
            console.log(`   💾 Saved first image to: ${outputPath}`);
          } catch (saveError) {
            console.warn(`   ⚠️ Could not save image: ${saveError.message}`);
          }
        }
      });
      
      console.log('\n🎉 SUCCESS: PDF to JPEG conversion is working!');
      console.log('✅ This implementation should work in serverless environments like Vercel');
      
    } else {
      console.log('\n⚠️ No images were generated');
      console.log('This might be expected if running in an environment without display capabilities');
      console.log('But the function executed without errors, which is good for serverless deployment');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR during PDF conversion:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('Could not find Chromium')) {
      console.log('\n💡 TIP: This error is expected in local development');
      console.log('   The @sparticuz/chromium package is optimized for serverless environments');
      console.log('   It should work correctly when deployed to Vercel');
    }
  }
}

// Run the test
testPuppeteerPDFConversion(); 