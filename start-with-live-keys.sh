#!/bin/bash

echo "🚀 Starting Next.js with LIVE Stripe keys..."

# Load environment variables from .env files
if [ -f .env.local ]; then
  echo "📄 Loading .env.local..."
  export $(grep -v '^#' .env.local | grep 'STRIPE_SECRET_KEY\|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\|STRIPE_WEBHOOK_SECRET' | xargs)
fi

if [ -f .env ]; then
  echo "📄 Loading .env..."
  export $(grep -v '^#' .env | grep 'STRIPE_SECRET_KEY\|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\|STRIPE_WEBHOOK_SECRET' | xargs)
fi

# Unset any test keys that might be set by Stripe CLI
unset STRIPE_PUBLISHABLE_KEY

# Verify we have the required keys
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "❌ STRIPE_SECRET_KEY not found in environment files"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
  echo "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in environment files"
  exit 1
fi

echo "✅ Environment variables loaded:"
echo "  STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:0:20}..."
echo "  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:0:20}..."
echo "  Key types: $(echo $STRIPE_SECRET_KEY | grep -q 'test' && echo 'TEST' || echo 'LIVE')"

echo ""
echo "🔄 Starting Next.js development server..."
npm run dev 