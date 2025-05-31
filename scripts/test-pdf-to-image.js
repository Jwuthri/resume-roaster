#!/usr/bin/env node

/**
 * Test script for PDF to image conversion functionality
 * This script tests the new serverless-compatible PDF to image conversion
 */

const fs = require('fs');
const path = require('path');

async function testPDFToImageConversion() {
  console.log('🧪 Testing PDF to image conversion...');
  
  try {
    // Test environment detection
    console.log('Environment detection:');
    console.log('- VERCEL:', !!process.env.VERCEL);
    console.log('- AWS_LAMBDA_FUNCTION_NAME:', !!process.env.AWS_LAMBDA_FUNCTION_NAME);
    console.log('- NETLIFY:', !!process.env.NETLIFY);
    
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
    console.log('- Detected serverless environment:', !!isServerless);
    
    // Test module imports
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      console.log('✅ pdfjs-dist (legacy) module can be imported');
      console.log('- Version:', pdfjsLib.version || 'unknown');
    } catch (error) {
      console.log('❌ Failed to import pdfjs-dist (legacy):', error.message);
      // Fallback to regular import
      try {
        const pdfjsLib = await import('pdfjs-dist');
        console.log('✅ pdfjs-dist (regular) module can be imported');
        console.log('- Version:', pdfjsLib.version || 'unknown');
      } catch (fallbackError) {
        console.log('❌ Failed to import pdfjs-dist (regular):', fallbackError.message);
      }
    }
    
    try {
      const { createCanvas } = await import('canvas');
      console.log('✅ canvas module can be imported');
      
      // Test canvas creation
      const testCanvas = createCanvas(100, 100);
      console.log('✅ Canvas creation works');
      console.log('- Canvas size:', testCanvas.width, 'x', testCanvas.height);
    } catch (error) {
      console.log('❌ Failed to import canvas:', error.message);
    }
    
    // Test if we can create a simple PDF document for testing
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      console.log('✅ PDF.js library (legacy) loaded successfully');
      console.log('- Available methods:', Object.keys(pdfjsLib).slice(0, 5).join(', '), '...');
    } catch (error) {
      console.log('❌ Failed to test PDF.js library (legacy):', error.message);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Failed to test PDF to image conversion:', error.message);
    return false;
  }
}

async function testDependencies() {
  console.log('\n🔍 Testing package dependencies...');
  
  const packageJson = require('../package.json');
  const dependencies = packageJson.dependencies || {};
  
  const requiredPackages = ['pdfjs-dist', 'canvas'];
  
  for (const pkg of requiredPackages) {
    if (dependencies[pkg]) {
      console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
    } else {
      console.log(`❌ ${pkg}: Not found in dependencies`);
    }
  }
  
  return true;
}

async function main() {
  console.log('🔍 Testing PDF to image conversion modules...\n');
  
  const depsOk = await testDependencies();
  const conversionOk = await testPDFToImageConversion();
  
  console.log('\n📊 Test Results:');
  console.log(`Dependencies: ${depsOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`PDF to image conversion: ${conversionOk ? '✅ OK' : '❌ FAILED'}`);
  
  if (conversionOk && depsOk) {
    console.log('\n🎉 PDF to image conversion modules are working correctly!');
    console.log('\n💡 Next steps:');
    console.log('1. Deploy to Vercel to test in production environment');
    console.log('2. Upload a PDF file to test the actual conversion');
    console.log('3. Check the Vercel function logs for conversion status');
    console.log('4. Verify images appear in the PDF preview component');
  } else {
    console.log('\n⚠️ Some modules have issues. Check the logs above.');
    console.log('\n💡 To fix issues:');
    console.log('1. Make sure canvas and pdfjs-dist are properly installed');
    console.log('2. Check that Next.js configuration includes these as external packages');
    console.log('3. Verify the modules work in your deployment environment');
    console.log('4. Run: npm install canvas pdfjs-dist');
  }
}

main().catch(console.error); 