# PDF to Image Converter Service

A FastAPI microservice that converts PDF files to JPEG images, designed for deployment on Heroku.

## Features

- Convert PDF files to high-quality JPEG images
- Returns base64-encoded images for easy frontend integration
- Supports up to 3 pages per PDF
- CORS enabled for frontend integration
- Health check endpoints for monitoring
- Optimized for Heroku deployment

## API Endpoints

### `POST /pdf-to-images`
Convert a PDF file to JPEG images.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: PDF file upload

**Response:**
```json
{
  "success": true,
  "images": ["base64_image_1", "base64_image_2", "base64_image_3"],
  "page_count": 3,
  "original_filename": "document.pdf"
}
```

### `GET /health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "pdf-converter"
}
```

## Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install system dependencies (Ubuntu/Debian):**
   ```bash
   sudo apt-get update
   sudo apt-get install poppler-utils
   ```

3. **Run the server:**
   ```bash
   python app.py
   ```

4. **Test the API:**
   ```bash
   curl -X POST "http://localhost:8000/pdf-to-images" \
        -H "accept: application/json" \
        -H "Content-Type: multipart/form-data" \
        -F "file=@your-pdf-file.pdf"
   ```

## Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Git repository initialized

### Deployment Steps

1. **Create a new Heroku app:**
   ```bash
   heroku create your-pdf-converter-app
   ```

2. **Add the apt buildpack for system dependencies:**
   ```bash
   heroku buildpacks:add --index 1 heroku-community/apt
   heroku buildpacks:add --index 2 heroku/python
   ```

3. **Deploy to Heroku:**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push heroku main
   ```

4. **Check the deployment:**
   ```bash
   heroku logs --tail
   heroku open
   ```

### Environment Variables

No additional environment variables are required for basic functionality.

### Buildpacks Used

1. `heroku-community/apt` - For installing `poppler-utils`
2. `heroku/python` - For Python runtime

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
async function convertPdfToImages(pdfFile: File): Promise<string[]> {
  const formData = new FormData();
  formData.append('file', pdfFile);

  try {
    const response = await fetch('https://your-pdf-converter-app.herokuapp.com/pdf-to-images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.images; // Array of base64 strings
    } else {
      throw new Error('PDF conversion failed');
    }
  } catch (error) {
    console.error('Error converting PDF:', error);
    throw error;
  }
}

// Usage
const pdfFile = document.getElementById('pdf-input').files[0];
const images = await convertPdfToImages(pdfFile);

// Display images
images.forEach((base64Image, index) => {
  const img = document.createElement('img');
  img.src = `data:image/jpeg;base64,${base64Image}`;
  document.body.appendChild(img);
});
```

### React Example

```tsx
import React, { useState } from 'react';

const PdfConverter: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://your-pdf-converter-app.herokuapp.com/pdf-to-images', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setImages(result.images);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={handleFileUpload} />
      {loading && <p>Converting PDF...</p>}
      <div>
        {images.map((image, index) => (
          <img
            key={index}
            src={`data:image/jpeg;base64,${image}`}
            alt={`Page ${index + 1}`}
            style={{ maxWidth: '100%', margin: '10px' }}
          />
        ))}
      </div>
    </div>
  );
};

export default PdfConverter;
```

## Troubleshooting

### Common Issues

1. **"poppler-utils not found" error:**
   - Ensure the apt buildpack is added before the Python buildpack
   - Check that `Aptfile` contains `poppler-utils`

2. **Memory issues on Heroku:**
   - Consider upgrading to a higher dyno type for large PDFs
   - The service limits to 3 pages to manage memory usage

3. **CORS issues:**
   - Update the `allow_origins` in the CORS middleware to your specific domain in production

### Monitoring

- Use `heroku logs --tail` to monitor real-time logs
- The `/health` endpoint can be used for uptime monitoring
- Consider adding application monitoring tools like New Relic or Datadog

## Performance Considerations

- **DPI Setting:** Currently set to 150 DPI for good quality/performance balance
- **Page Limit:** Limited to 3 pages to prevent memory issues
- **Image Quality:** JPEG quality set to 85% for optimal size/quality ratio
- **Memory Usage:** Each page conversion uses approximately 10-20MB of memory

## Security Considerations

- File type validation ensures only PDF files are processed
- No file storage - all processing is done in memory
- CORS should be configured for your specific domain in production
- Consider adding rate limiting for production use

## License

MIT License - feel free to use and modify as needed. 