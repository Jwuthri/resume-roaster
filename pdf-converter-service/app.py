from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import base64
import io
from pdf2image import convert_from_bytes
from PIL import Image
import os
from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PDF to Image Converter",
    description="Convert PDF files to JPEG images",
    version="1.0.0"
)

# Add CORS middleware to allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "PDF to Image Converter Service", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check for monitoring"""
    return {"status": "healthy", "service": "pdf-converter"}

@app.post("/pdf-to-images")
async def convert_pdf_to_images(file: UploadFile = File(...)) -> JSONResponse:
    """
    Convert PDF file to JPEG images
    
    Args:
        file: PDF file upload
        
    Returns:
        JSON response with list of base64 encoded JPEG images
    """
    try:
        # Validate file type
        if not file.content_type == "application/pdf":
            raise HTTPException(
                status_code=400, 
                detail="File must be a PDF"
            )
        
        # Read PDF content
        pdf_content = await file.read()
        logger.info(f"Processing PDF: {file.filename}, Size: {len(pdf_content)} bytes")
        
        # Convert PDF to images
        try:
            # Convert PDF pages to PIL Images
            # dpi=150 gives good quality, first_page and last_page limit to 3 pages max
            images = convert_from_bytes(
                pdf_content,
                dpi=150,
                first_page=1,
                last_page=3,  # Limit to first 3 pages
                fmt='jpeg'
            )
            
            logger.info(f"Successfully converted PDF to {len(images)} images")
            
        except Exception as e:
            logger.error(f"Error converting PDF: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to convert PDF: {str(e)}"
            )
        
        # Convert images to base64
        base64_images = []
        for i, image in enumerate(images):
            try:
                # Convert PIL Image to JPEG bytes
                img_buffer = io.BytesIO()
                
                # Convert to RGB if necessary (for JPEG compatibility)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Save as JPEG with good quality
                image.save(img_buffer, format='JPEG', quality=85, optimize=True)
                img_bytes = img_buffer.getvalue()
                
                # Convert to base64
                base64_image = base64.b64encode(img_bytes).decode('utf-8')
                base64_images.append(base64_image)
                
                logger.info(f"Converted page {i+1} to base64 ({len(base64_image)} chars)")
                
            except Exception as e:
                logger.error(f"Error converting page {i+1} to base64: {str(e)}")
                continue
        
        if not base64_images:
            raise HTTPException(
                status_code=500,
                detail="Failed to convert any pages to images"
            )
        
        return JSONResponse(content={
            "success": True,
            "images": base64_images,
            "page_count": len(base64_images),
            "original_filename": file.filename
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) 