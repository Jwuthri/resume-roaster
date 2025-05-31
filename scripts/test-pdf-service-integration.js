const { convertPDFToImages } = require('../src/lib/pdf-to-image.ts');

async function testPDFServiceIntegration() {
  console.log('🧪 Testing PDF Service Integration...\n');
  
  // Create a minimal test PDF
  const testPDF = Buffer.from(`%PDF-1.4
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
%%EOF`);

  try {
    console.log(`📄 Testing with ${Math.round(testPDF.length / 1024)}KB PDF...`);
    
    const images = await convertPDFToImages(testPDF);
    
    if (images.length > 0) {
      console.log(`✅ SUCCESS! Generated ${images.length} images`);
      console.log(`📊 First image size: ${Math.round(images[0].length / 1024)}KB base64`);
      console.log('\n🎉 Your PDF to image conversion is working!');
      console.log('✅ Next.js app can now convert PDFs to images via Heroku service');
    } else {
      console.log('⚠️ No images generated - service may be down or PDF invalid');
    }
    
  } catch (error) {
    console.error('❌ Error testing PDF service:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the Heroku service is running: https://pdf-2-jpg-85b286e7f371.herokuapp.com/health');
    console.log('2. Verify the environment variable PDF_CONVERTER_SERVICE_URL is set');
    console.log('3. Check network connectivity');
  }
}

testPDFServiceIntegration(); 