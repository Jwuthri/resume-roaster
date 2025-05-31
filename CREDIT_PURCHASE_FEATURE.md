# Credit Purchase Feature

## Overview

The credit purchase feature allows PLUS subscribers to buy additional credits as a one-time payment when they need more than their monthly allowance.

## Key Features

- **PLUS Only**: Only available for PLUS tier subscribers
- **One-time Payment**: $5.99 for 200 credits
- **Bonus Credits**: Credits don't expire and don't reset monthly
- **Smart Usage**: Bonus credits are used after monthly allowance is exhausted

## Implementation Details

### Database Schema

Added `bonusCredits` field to the User model:
```prisma
model User {
  // ... existing fields
  bonusCredits      Int      @default(0) @map("bonus_credits") // One-time purchased credits that don't reset
  // ... rest of fields
}
```

### Stripe Configuration

- **Product ID**: `..`
- **Price**: $5.99 USD
- **Mode**: One-time payment (not subscription)
- **Credits**: 200 bonus credits

### API Endpoints

1. **`/api/stripe/create-credit-checkout`**
   - Creates Stripe checkout session for credit purchase
   - Validates user is PLUS tier
   - Returns checkout URL

2. **`/api/stripe/webhook`**
   - Handles `checkout.session.completed` events
   - Adds bonus credits to user account
   - Validates purchase authenticity

### Credit Usage Logic

Credits are consumed in this order:
1. Monthly allowance (resets monthly)
2. Bonus credits (persistent, don't reset)

### UI Components

1. **`CreditPurchase`** - Purchase component for PLUS users
2. **Dashboard Integration** - Shows purchase option
3. **Settings Page** - Displays bonus credit balance

## User Experience

### For PLUS Users
- See "Buy Extra Credits" card in dashboard
- Click to purchase 200 credits for $5.99
- Redirected to Stripe checkout
- Credits added immediately after payment
- Success message shown on return

### Credit Display
- Monthly credits: Shows remaining from monthly allowance
- Bonus credits: Shows separately in settings
- Total available: Monthly + bonus credits

## Security

- Server-side validation of user tier
- Stripe webhook signature verification
- Metadata validation for credit amounts
- User authentication required

## Testing

To test the feature:
1. Create a PLUS user account
2. Use Stripe test cards (4242 4242 4242 4242)
3. Verify credits are added to account
4. Test credit consumption order

## Environment Variables

```bash
STRIPE_CREDIT_PACK_200_PRICE_ID=".."
```

## Future Enhancements

- Multiple credit pack sizes
- Bulk discounts for larger purchases
- Gift credit functionality
- Credit expiration policies 