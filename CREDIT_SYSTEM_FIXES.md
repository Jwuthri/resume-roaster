# Credit System Fixes

## Issues Found and Fixed

### 1. **Credit Deduction Not Implemented**
**Problem**: The credit deduction system existed in the database service (`UserService.deductModelCredits()`) but was never called in any API routes that use AI models.

**Solution**: Added credit checking and deduction to all AI-powered API routes that should cost credits:

- ✅ `/api/analyze-resume` - Resume analysis with AI models
- ✅ `/api/extract-pdf-ai` - AI-powered PDF extraction  
- ✅ `/api/generate-cover-letter` - Cover letter generation
- ✅ `/api/optimize-resume` - Resume optimization
- ✅ `/api/extract-resume-data` - Resume data extraction and structuring
- ✅ `/api/evaluate-answer` - Individual interview answer evaluation
- ✅ `/api/evaluate-session` - Complete interview session evaluation
- ✅ `/api/generate-interview-prep` - Interview preparation questions and tips
- ❌ `/api/summarized_resumes` - **FREE** (preparatory step for better analysis)
- ❌ `/api/summarize-job-description` - **FREE** (preparatory step for better analysis)
- ❌ `/api/chatbot` - **FREE** (customer support)

### 2. **Dashboard Quick Actions Not Working**
**Problem**: The dashboard quick actions (Generate Cover Letter, Interview Prep, Optimize Resume) were not properly calling the API routes or were calling placeholder functions.

**Solution**: 
- ✅ **Cover Letter Generation**: Already working correctly via `/api/generate-cover-letter`
- ✅ **Interview Prep**: Fixed to properly call `/api/generate-interview-prep` with credit checking
- ✅ **Resume Optimization**: Updated dashboard to call `/api/optimize-resume` instead of placeholder function
- ✅ **Model Selection**: Fixed `/api/optimize-resume` to properly use the selected LLM model instead of hardcoded models

### 3. **Credit Cost Inconsistency**
**Problem**: The `UserService.getModelCreditCost()` method had hardcoded credit costs that differed from the constants file.

**Solution**: Updated the method to use the centralized `MODEL_CREDIT_COSTS` from `/src/lib/constants.ts`.

### 4. **Missing Credit Validation**
**Problem**: API routes didn't check if users had sufficient credits before making expensive AI calls.

**Solution**: Added `UserService.checkModelAffordability()` checks before all AI operations that should cost credits.

### 5. **Subscription Tier Limits**
**Problem**: PLUS tier was set to 100 credits instead of 200 credits.

**Solution**: Updated `MONTHLY_LIMITS` in database service to reflect correct PLUS tier limit of 200 credits.

## Implementation Details

### Credit Checking Flow
```typescript
// 1. Check if user can afford the model
const affordability = await UserService.checkModelAffordability(userId, modelName)
if (!affordability.canAfford) {
  return NextResponse.json({
    error: `Insufficient credits. This model costs ${affordability.creditCost} credits, but you only have ${affordability.remaining} credits remaining.`,
    creditCost: affordability.creditCost,
    remaining: affordability.remaining,
    tier: affordability.tier
  }, { status: 402 }) // Payment Required
}

// 2. Make AI call
const response = await callAI(...)

// 3. Deduct credits after successful completion
try {
  await UserService.deductModelCredits(userId, modelName)
  console.log(`Successfully deducted ${affordability.creditCost} credits`)
} catch (creditError) {
  console.error('Failed to deduct credits:', creditError)
  // Log error but don't fail the request since AI call succeeded
}
```

### Credit Costs (Fixed)
```typescript
export const MODEL_CREDIT_COSTS = {
  // OpenAI models
  'gpt-4.1-nano': 1,           // Basic operations
  'gpt-4.1-mini': 4,           // Standard analysis  
  'gpt-4.1': 8,                // Advanced features
  'o4-mini-high': 12,          // Premium operations
  // Anthropic models
  'claude-3-5-haiku-20241022': 1,     // Fast responses
  'claude-sonnet-4-20250514': 8,      // Main analysis model
  'claude-opus-4-20250514': 12,       // Premium analysis
}
```

### Free Operations (No Credits Required)
These operations are free to encourage users to prepare better data for analysis:

1. **Resume Summarization** (`/api/summarized_resumes`)
   - Helps structure resume data for better analysis
   - Uses Claude Sonnet but doesn't deduct credits
   - Preparatory step that improves analysis quality

2. **Job Description Summarization** (`/api/summarize-job-description`)
   - Extracts key requirements and keywords
   - Uses OpenAI Mini but doesn't deduct credits
   - Helps users understand what to optimize for

3. **Chatbot** (`/api/chatbot`)
   - Customer support and career advice
   - Uses OpenAI Nano but doesn't deduct credits
   - Available to all users (authenticated and anonymous)

### Error Handling
- **402 Payment Required**: Returned when user has insufficient credits
- **Credit deduction failures**: Logged but don't fail the request (since AI call succeeded)
- **Detailed error messages**: Include credit cost, remaining credits, and user tier

### Response Metadata
All AI-powered endpoints now include credit information in responses:
```typescript
{
  success: true,
  data: { ... },
  metadata: {
    tokensUsed,
    processingTime,
    estimatedCost,
    creditsDeducted: affordability.creditCost // Only for paid operations
  }
}
```

## Testing Recommendations

### 1. **Test Credit Deduction**
- Use a 4-credit model (like `gpt-4.1-mini`) and verify exactly 4 credits are deducted
- Use an 8-credit model (like `claude-sonnet-4-20250514`) and verify exactly 8 credits are deducted

### 2. **Test Credit Validation**
- Set user credits to 3, try to use a 4-credit model, should get 402 error
- Verify error message includes correct credit costs and remaining balance

### 3. **Test PDF Extraction Credits**
- Upload a PDF and use AI extraction
- Verify credits are deducted based on the selected model

### 4. **Test Credit Purchase Flow**
- Purchase credits as a PLUS user
- Verify credits are added to account via Stripe webhook
- Test that purchased credits are used after monthly allowance

### 5. **Test Interview Evaluation Credits**
- Use individual answer evaluation (1 credit with NANO model)
- Use session evaluation (4 credits with MINI model)
- Verify correct credit deduction for each

### 6. **Test Free Operations**
- **Resume Summarization**: Verify no credits are deducted
- **Job Description Summarization**: Verify no credits are deducted  
- **Chatbot**: Verify works without authentication and no credits deducted

## Credit Usage Priority
Credits are consumed in this order:
1. **Monthly allowance** (resets monthly based on subscription tier)
2. **Bonus credits** (purchased credits that don't expire)

## Subscription Tiers
- **FREE**: 5 credits/month
- **PLUS**: 200 credits/month + ability to purchase bonus credits
- **PREMIUM**: Unlimited credits

## Files Modified
- `src/app/api/analyze-resume/route.ts`
- `src/app/api/extract-pdf-ai/route.ts`
- `src/app/api/generate-cover-letter/route.ts`
- `src/app/api/optimize-resume/route.ts`
- `src/app/api/extract-resume-data/route.ts`
- `src/app/api/evaluate-answer/route.ts`
- `src/app/api/evaluate-session/route.ts`
- `src/app/api/generate-interview-prep/route.ts` (added credit checking)
- `src/app/api/summarized_resumes/route.ts` (made FREE)
- `src/app/api/summarize-job-description/route.ts` (made FREE)
- `src/app/dashboard/page.tsx` (fixed resume optimization to call actual API)
- `src/lib/database.ts` (fixed getModelCreditCost method and PLUS tier limits)

## Next Steps
1. **Test the fixes** with different models and credit scenarios
2. **Monitor credit deduction** in production logs
3. **Update frontend** to show credit costs before AI operations
4. **Add credit usage analytics** to user dashboard 

## Summary
✅ **All AI-powered API routes now properly implement the credit system**
✅ **Credit costs are consistent across the application**
✅ **Users are validated before expensive AI operations**
✅ **Preparatory operations (summarization) are free to encourage better analysis**
✅ **Chatbot remains free for customer support**
✅ **Comprehensive error handling and logging** 