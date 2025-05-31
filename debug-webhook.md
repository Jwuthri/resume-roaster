# Debugging Credit Purchase Webhook Issue

## Current Status
- ✅ Database connection working
- ✅ `addBonusCredits` method working
- ✅ Stripe price ID configured: `price_1RUu58LrexuPnrRxIMCgOHkA`
- ✅ Webhook endpoint accessible
- ❌ Credits not being added after purchase

## Debugging Steps

### 1. Check Stripe Webhook Configuration

Go to your Stripe Dashboard → Developers → Webhooks and verify:

1. **Webhook URL**: Should be something like:
   - Local development: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
   - Production: `https://your-domain.com/api/stripe/webhook`

2. **Events to send**: Make sure `checkout.session.completed` is selected

3. **Webhook signing secret**: Copy this and make sure it matches your `STRIPE_WEBHOOK_SECRET` in `.env.local`

### 2. Check Recent Webhook Attempts

In Stripe Dashboard → Developers → Webhooks → [Your Webhook] → Recent deliveries:
- Look for recent `checkout.session.completed` events
- Check if they were delivered successfully (200 status)
- If failed, check the error message

### 3. Local Development Setup

If testing locally, you need to expose your local server to Stripe:

```bash
# Install Stripe CLI if not already installed
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook signing secret that starts with `whsec_...`

### 4. Check Environment Variables

Verify these are set in `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET="whsec_..." # From Stripe CLI or Dashboard
STRIPE_CREDIT_PACK_200_PRICE_ID="price_1RUu58LrexuPnrRxIMCgOHkA"
```

### 5. Test Credit Purchase Flow

1. Make a test purchase
2. Check the server console for webhook logs (we added detailed logging)
3. Check Stripe Dashboard for webhook delivery status

### 6. Manual Credit Addition (Temporary Fix)

If you need to add credits manually while debugging:

```javascript
// Run this in your database or create a script
UPDATE users SET bonus_credits = bonus_credits + 200 WHERE email = 'your-email@example.com';
```

## Expected Webhook Flow

1. User completes checkout → Stripe sends `checkout.session.completed` webhook
2. Webhook handler receives event → Logs "🔔 Webhook received"
3. Finds user by customer ID → Logs "✅ Found user"
4. Processes payment mode → Logs "💳 Processing one-time payment"
5. Adds credits → Logs "✅ Credit purchase completed"

## Next Steps

1. Check Stripe webhook configuration
2. Look at webhook delivery logs in Stripe Dashboard
3. If using local development, set up Stripe CLI forwarding
4. Make another test purchase and watch the console logs 