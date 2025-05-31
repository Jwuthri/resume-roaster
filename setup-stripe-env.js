#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')

// Required Stripe environment variables
const stripeEnvVars = `
# Stripe Configuration (Add your actual keys from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Stripe Price IDs (Create these in your Stripe dashboard first)
STRIPE_PRO_MONTHLY_PRICE_ID="price_your_pro_monthly_price_id"
STRIPE_PRO_YEARLY_PRICE_ID="price_your_pro_yearly_price_id"
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID="price_your_enterprise_monthly_price_id"
STRIPE_ENTERPRISE_YEARLY_PRICE_ID="price_your_enterprise_yearly_price_id"
STRIPE_CREDIT_PACK_200_PRICE_ID="..."

# Public Stripe Price IDs (for frontend - same as above)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID="price_your_pro_monthly_price_id"
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID="price_your_pro_yearly_price_id"
NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID="price_your_enterprise_monthly_price_id"
NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID="price_your_enterprise_yearly_price_id"
`

console.log('🔧 Setting up Stripe environment variables...\n')

try {
  let envContent = ''
  
  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
    console.log('✅ Found existing .env.local file')
    
    // Check if Stripe variables already exist
    if (envContent.includes('STRIPE_SECRET_KEY')) {
      console.log('⚠️  Stripe variables already exist in .env.local')
      console.log('Please update them manually with your actual Stripe keys.')
      process.exit(0)
    }
  } else {
    console.log('📝 Creating new .env.local file')
  }
  
  // Append Stripe variables
  const updatedContent = envContent + stripeEnvVars
  fs.writeFileSync(envPath, updatedContent)
  
  console.log('✅ Added Stripe environment variables to .env.local\n')
  console.log('🚨 IMPORTANT: You need to replace the placeholder values with your actual Stripe keys:\n')
  console.log('1. Go to https://dashboard.stripe.com/test/apikeys')
  console.log('2. Copy your Publishable key and Secret key')
  console.log('3. Replace the placeholder values in .env.local\n')
  console.log('4. Create products and prices in Stripe Dashboard:')
  console.log('   - Pro Plan: $9.99/month and $99.99/year')
  console.log('   - Enterprise Plan: $49.99/month and $499.99/year')
  console.log('   - Credit Pack: $5.99 one-time for 200 credits (PLUS users only)')
  console.log('5. Copy the price IDs and update them in .env.local\n')
  console.log('6. Restart your development server: npm run dev\n')
  console.log('📖 For detailed setup instructions, see STRIPE_SETUP.md')
  
} catch (error) {
  console.error('❌ Error setting up environment variables:', error.message)
  process.exit(1)
} 