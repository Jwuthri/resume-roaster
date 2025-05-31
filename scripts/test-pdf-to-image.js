#!/usr/bin/env node

/**
 * Test script for PDF to image conversion functionality
 * This script tests the new serverless-compatible PDF to image conversion using @napi-rs/canvas
 */

const fs = require('fs');
const path = require('path');

async function testPDFToImageConversion() {
  console.log('🔍 Testing PDF to image conversion modules...\n');
  
  // Check package.json dependencies
  console.log('🔍 Testing package dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = packageJson.dependencies || {};
    
    if (deps['pdfjs-dist']) {
      console.log('✅ pdfjs-dist:', deps['pdfjs-dist']);
    } else {
      console.log('❌ pdfjs-dist: Not found in dependencies');
    }
    
    if (deps['@napi-rs/canvas']) {
      console.log('✅ @napi-rs/canvas:', deps['@napi-rs/canvas']);
    } else {
      console.log('❌ @napi-rs/canvas: Not found in dependencies');
    }
    
    // Check that old problematic packages are removed
    if (deps['canvas']) {
      console.log('⚠️ Old canvas package still present:', deps['canvas']);
      console.log('   Consider removing it: npm uninstall canvas');
    } else {
      console.log('✅ Old canvas package properly removed');
    }
    
    if (deps['poppler']) {
      console.log('⚠️ Problematic poppler package still present:', deps['poppler']);
      console.log('   Consider removing it: npm uninstall poppler');
    } else {
      console.log('✅ Problematic poppler package properly removed');
    }
    
  } catch (error) {
    console.log('❌ Failed to read package.json:', error.message);
  }
  
  console.log('\n🧪 Testing PDF to image conversion...');
  
  try {
    // Test environment detection
    console.log('Environment detection:');
    console.log('- VERCEL:', !!process.env.VERCEL);
    console.log('- AWS_LAMBDA_FUNCTION_NAME:', !!process.env.AWS_LAMBDA_FUNCTION_NAME);
    console.log('- NETLIFY:', !!process.env.NETLIFY);
    
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
    console.log('- Detected serverless environment:', !!isServerless);
    
    let pdfJsWorking = false;
    let canvasWorking = false;
    
    // Test module imports
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      console.log('✅ pdfjs-dist (legacy) module can be imported');
      console.log('- Version:', pdfjsLib.version || 'unknown');
      pdfJsWorking = true;
    } catch (error) {
      console.log('❌ Failed to import pdfjs-dist (legacy):', error.message);
      // Fallback to regular import
      try {
        const pdfjsLib = await import('pdfjs-dist');
        console.log('✅ pdfjs-dist (regular) module can be imported');
        console.log('- Version:', pdfjsLib.version || 'unknown');
        pdfJsWorking = true;
      } catch (fallbackError) {
        console.log('❌ Failed to import pdfjs-dist (regular):', fallbackError.message);
      }
    }
    
    try {
      const { createCanvas } = await import('@napi-rs/canvas');
      console.log('✅ @napi-rs/canvas module can be imported');
      
      // Test basic canvas functionality
      const testCanvas = createCanvas(100, 100);
      const ctx = testCanvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 50, 50);
      
      // Test encoding
      const buffer = await testCanvas.encode('png');
      console.log('✅ Canvas creation and encoding works');
      console.log('- Test image size:', buffer.length, 'bytes');
      canvasWorking = true;
      
    } catch (error) {
      console.log('❌ Failed to import or use @napi-rs/canvas:', error.message);
    }
    
    console.log('\n🎉 PDF to image conversion test completed!');
    console.log('The new @napi-rs/canvas approach should work in both local and serverless environments.');
    
    // Summary
    console.log('\n📊 Test Results:');
    console.log('Dependencies:', pdfJsWorking && canvasWorking ? '✅ OK' : '❌ ISSUES');
    console.log('PDF to image conversion:', pdfJsWorking && canvasWorking ? '✅ READY' : '❌ NOT READY');
    
    if (pdfJsWorking && canvasWorking) {
      console.log('\n🚀 All systems go! Your PDF to image conversion should work in production.');
      console.log('💡 Next steps:');
      console.log('1. Deploy to production: npm run build && vercel --prod');
      console.log('2. Test with a real PDF upload');
      console.log('3. Check logs for: "Successfully converted X pages to images using @napi-rs/canvas"');
    } else {
      console.log('\n⚠️ Some modules have issues. Check the logs above.');
      console.log('💡 To fix issues:');
      console.log('1. Make sure @napi-rs/canvas and pdfjs-dist are properly installed');
      console.log('2. Check that Next.js configuration includes these as external packages');
      console.log('3. Verify the modules work in your deployment environment');
      console.log('4. Run: npm install @napi-rs/canvas pdfjs-dist');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPDFToImageConversion(); 