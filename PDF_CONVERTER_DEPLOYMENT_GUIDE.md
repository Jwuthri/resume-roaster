# PDF Converter Microservice - Complete Deployment Guide

## 🎯 Overview

This guide will help you deploy a Python FastAPI microservice to Heroku that converts PDF files to JPEG images. This solves the serverless PDF conversion issues you were experiencing with your Next.js app.

## 📁 Project Structure

```
pdf-converter-service/
├── app.py              # FastAPI application
├── requirements.txt    # Python dependencies
├── Procfile           # Heroku process definition
├── runtime.txt        # Python version
├── Aptfile           # System dependencies
├── heroku.yml        # Heroku configuration
├── deploy.sh         # Automated deployment script
├── test_local.py     # Local testing script
├── .gitignore        # Git ignore rules
└── README.md         # Documentation
```

## 🚀 Quick Deployment (Automated)

1. **Navigate to the service directory:**
   ```bash
   cd pdf-converter-service
   ```

2. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

3. **Follow the prompts** - the script will handle everything automatically!

## 🔧 Manual Deployment (Step by Step)

### Prerequisites
- Heroku CLI installed
- Git repository initialized
- Heroku account

### Step 1: Create Heroku App
```bash
heroku create your-pdf-converter-app
```

### Step 2: Configure Buildpacks
```bash
heroku buildpacks:add --index 1 heroku-community/apt
heroku buildpacks:add --index 2 heroku/python
```

### Step 3: Deploy
```bash
git add .
git commit -m "Deploy PDF converter service"
git push heroku main
```

### Step 4: Test Deployment
```bash
curl https://your-pdf-converter-app.herokuapp.com/health
```

## 🧪 Local Testing

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install system dependencies (Ubuntu/Debian):**
   ```bash
   sudo apt-get install poppler-utils
   ```

3. **Run the service:**
   ```bash
   python app.py
   ```

4. **Test with the test script:**
   ```bash
   python test_local.py
   ```

## 🔗 Frontend Integration

### Update Your Next.js Environment Variables

Add this to your `.env.local`:
```bash
PDF_CONVERTER_SERVICE_URL=https://your-pdf-converter-app.herokuapp.com
```

### The Frontend Code is Already Updated

Your `src/lib/pdf-to-image.ts` has been updated to use the microservice. It will:

1. Send the PDF buffer to your Heroku service
2. Receive back an array of base64-encoded JPEG images
3. Fall back to text-only mode if the service is unavailable

### API Usage Example

```typescript
// Your existing code will work automatically!
const images = await convertPDFToImages(pdfBuffer);
// images is now an array of base64 strings from the Heroku service
```

## 📊 Service Endpoints

### `POST /pdf-to-images`
- **Input:** PDF file (multipart/form-data)
- **Output:** JSON with base64 images array
- **Limit:** First 3 pages only

### `GET /health`
- **Output:** Service health status
- **Use:** Monitoring and uptime checks

## 🔍 Monitoring & Debugging

### View Logs
```bash
heroku logs --tail -a your-pdf-converter-app
```

### Check Service Status
```bash
heroku ps -a your-pdf-converter-app
```

### Restart Service
```bash
heroku restart -a your-pdf-converter-app
```

### Test Health Endpoint
```bash
curl https://your-pdf-converter-app.herokuapp.com/health
```

## 💰 Cost Considerations

- **Heroku Free Tier:** No longer available
- **Heroku Basic ($7/month):** Perfect for this service
- **Usage:** Only charged when processing PDFs
- **Memory:** Service uses ~50-100MB base + ~20MB per page

## 🛠️ Troubleshooting

### Common Issues

1. **"poppler-utils not found"**
   - Ensure apt buildpack is added first
   - Check Aptfile contains `poppler-utils`

2. **Memory errors**
   - Upgrade to higher dyno type
   - Service limits to 3 pages to prevent this

3. **CORS errors**
   - Service has CORS enabled for all origins
   - Update CORS settings in production for security

4. **Timeout errors**
   - Large PDFs may take time to process
   - Consider implementing async processing for very large files

### Debug Steps

1. Check Heroku logs: `heroku logs --tail`
2. Test health endpoint: `curl https://your-app.herokuapp.com/health`
3. Test with minimal PDF using the test script
4. Verify buildpacks are in correct order

## 🔒 Security Considerations

- Service validates file types (PDF only)
- No file storage - all processing in memory
- CORS configured (update for production)
- Consider adding rate limiting for production use

## 📈 Performance Optimization

- **DPI:** Set to 150 for good quality/speed balance
- **Page Limit:** 3 pages max to manage memory
- **Image Quality:** 85% JPEG quality
- **Caching:** Consider adding Redis for repeated conversions

## 🎉 Success Verification

After deployment, you should see:

1. ✅ Health endpoint returns `{"status": "healthy"}`
2. ✅ PDF conversion returns base64 images
3. ✅ Your Next.js app shows PDF images instead of text-only
4. ✅ No more "Failed to load native binding" errors

## 📞 Support

If you encounter issues:

1. Check the logs: `heroku logs --tail`
2. Verify all files are present in the service directory
3. Ensure buildpacks are in the correct order
4. Test locally first with `python test_local.py`

## 🎯 Next Steps

1. Deploy the service to Heroku
2. Update your environment variable
3. Test with real PDF files
4. Monitor performance and costs
5. Consider adding authentication for production use

---

**That's it!** You now have a robust, serverless-compatible PDF to image conversion service that will work perfectly with your resume analysis application! 🚀 