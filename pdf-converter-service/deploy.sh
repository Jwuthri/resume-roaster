#!/bin/bash

# PDF to Image Converter - Heroku Deployment Script
# This script automates the deployment process to Heroku

set -e  # Exit on any error

echo "🚀 PDF to Image Converter - Heroku Deployment"
echo "=============================================="

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if user is logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ You are not logged in to Heroku. Please run:"
    echo "   heroku login"
    exit 1
fi

# Get app name from user or use default
read -p "Enter your Heroku app name (or press Enter for 'pdf-2-jpg'): " APP_NAME
APP_NAME=${APP_NAME:-pdf-2-jpg}

echo "📝 Using app name: $APP_NAME"

# Check if app already exists
if heroku apps:info $APP_NAME &> /dev/null; then
    echo "✅ App '$APP_NAME' already exists"
else
    echo "🆕 Creating new Heroku app: $APP_NAME"
    heroku create $APP_NAME
fi

# Set the Heroku remote
echo "🔗 Setting up Heroku remote..."
heroku git:remote -a $APP_NAME

# Add buildpacks in the correct order
echo "🔧 Configuring buildpacks..."
heroku buildpacks:clear
heroku buildpacks:add --index 1 heroku-community/apt
heroku buildpacks:add --index 2 heroku/python

# Show current buildpacks
echo "📋 Current buildpacks:"
heroku buildpacks

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "🔄 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# Deploy to Heroku
echo "🚀 Deploying to Heroku..."
git add .
git commit -m "Deploy PDF converter service" || echo "No changes to commit"
git push heroku main

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 10

# Test the deployment
echo "🧪 Testing the deployed service..."
APP_URL="https://$APP_NAME.herokuapp.com"

# Test health endpoint
echo "   Testing health endpoint..."
if curl -s "$APP_URL/health" | grep -q "healthy"; then
    echo "   ✅ Health check passed"
else
    echo "   ❌ Health check failed"
fi

# Show logs
echo "📋 Recent logs:"
heroku logs --tail --num 20

echo ""
echo "🎉 Deployment completed!"
echo "📍 Your service is available at: $APP_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Test your service: curl $APP_URL/health"
echo "   2. Update your frontend environment variable:"
echo "      PDF_CONVERTER_SERVICE_URL=$APP_URL"
echo "   3. Test PDF conversion with a real PDF file"
echo ""
echo "🔧 Useful commands:"
echo "   heroku logs --tail -a $APP_NAME    # View real-time logs"
echo "   heroku restart -a $APP_NAME        # Restart the app"
echo "   heroku ps -a $APP_NAME             # Check dyno status"
echo "   heroku config -a $APP_NAME         # View environment variables" 