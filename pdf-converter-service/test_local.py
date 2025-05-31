#!/usr/bin/env python3
"""
Local test script for the PDF to Image converter service
"""

import requests
import base64
import os
from pathlib import Path

def create_test_pdf():
    """Create a minimal test PDF for testing"""
    pdf_content = b"""%PDF-1.4
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
%%EOF"""
    
    with open('test.pdf', 'wb') as f:
        f.write(pdf_content)
    
    return 'test.pdf'

def test_health_endpoint(base_url="http://localhost:8000"):
    """Test the health endpoint"""
    print("🏥 Testing health endpoint...")
    
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_pdf_conversion(base_url="http://localhost:8000", pdf_file=None):
    """Test the PDF to images conversion"""
    print("\n📄 Testing PDF to images conversion...")
    
    # Create test PDF if none provided
    if pdf_file is None:
        pdf_file = create_test_pdf()
        print(f"   Created test PDF: {pdf_file}")
    
    try:
        # Prepare the file upload
        with open(pdf_file, 'rb') as f:
            files = {'file': ('test.pdf', f, 'application/pdf')}
            
            print(f"   Uploading PDF to {base_url}/pdf-to-images...")
            response = requests.post(f"{base_url}/pdf-to-images", files=files)
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get('success'):
                print("✅ PDF conversion successful!")
                print(f"   Pages converted: {result.get('page_count', 0)}")
                print(f"   Original filename: {result.get('original_filename', 'N/A')}")
                
                # Save first image for verification
                if result.get('images'):
                    first_image = result['images'][0]
                    image_data = base64.b64decode(first_image)
                    
                    with open('test_output_page1.jpg', 'wb') as f:
                        f.write(image_data)
                    
                    print(f"   💾 Saved first image: test_output_page1.jpg ({len(image_data)} bytes)")
                    print(f"   📊 Base64 length: {len(first_image)} characters")
                
                return True
            else:
                print(f"❌ PDF conversion failed: {result}")
                return False
        else:
            print(f"❌ HTTP error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ PDF conversion error: {e}")
        return False
    finally:
        # Clean up test files
        if pdf_file == 'test.pdf' and os.path.exists('test.pdf'):
            os.remove('test.pdf')

def main():
    """Run all tests"""
    print("🧪 Testing PDF to Image Converter Service\n")
    
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    health_ok = test_health_endpoint(base_url)
    
    if health_ok:
        # Test PDF conversion
        conversion_ok = test_pdf_conversion(base_url)
        
        if conversion_ok:
            print("\n🎉 All tests passed! Service is working correctly.")
            print("\n📝 Next steps:")
            print("   1. Deploy to Heroku using the instructions in README.md")
            print("   2. Update your frontend to use the Heroku URL")
            print("   3. Test with real PDF files")
        else:
            print("\n❌ PDF conversion test failed")
    else:
        print("\n❌ Service is not running or health check failed")
        print("   Make sure to start the service with: python app.py")

if __name__ == "__main__":
    main() 