# Chatbot Session Isolation Fix

## Problem
The chatbot was sharing conversations between all anonymous (non-logged-in) users because they all had `userId: null` in the database. This meant that when one anonymous user started a conversation, all other anonymous users could see and continue that same conversation.

## Solution
Implemented unique session identification for anonymous users using a combination of:

1. **IP Address**: Extracted from request headers (`x-forwarded-for` or `x-real-ip`)
2. **Session Token**: A UUID stored in the browser's localStorage
3. **Hashed Identifier**: Combined IP + session token, hashed for privacy

### Key Changes

#### 1. Backend API (`src/app/api/chatbot/route.ts`)
- Added `generateAnonymousUserId()` function that creates unique identifiers for anonymous users
- Modified both GET and POST endpoints to use this identifier instead of `null` for anonymous users
- Added session token management in response headers

#### 2. Frontend Provider (`src/components/providers/chatbot-provider.tsx`)
- Added session token management in localStorage
- Implemented automatic session token clearing when users log in
- Added session token to all API requests via headers
- Added session monitoring to refresh conversations when authentication status changes

#### 3. Session Token Management
- **Anonymous users**: Get a unique session token stored in localStorage
- **Logged-in users**: Use their actual user ID, session token is cleared
- **Session persistence**: Tokens persist across browser sessions until user logs in

## How It Works

### For Anonymous Users
1. Browser generates/retrieves session token from localStorage
2. Session token is sent with every API request via `x-session-token` header
3. Backend combines IP address + session token to create unique user identifier
4. Conversations are stored with this unique identifier instead of `null`

### For Logged-in Users
1. Session token is cleared from localStorage when user authenticates
2. User's actual database ID is used for conversation storage
3. No session token is sent in requests

### Session Isolation
- Each anonymous user gets a unique identifier like: `anon_a1b2c3d4e5f6g7h8`
- This identifier is consistent for the same browser/IP combination
- Different browsers or IP addresses get different identifiers
- Conversations are completely isolated between different anonymous sessions

## Testing the Fix

### Test Case 1: Anonymous User Isolation
1. Open the website in an incognito/private browser window
2. Start a conversation with the chatbot
3. Open another incognito window (different session)
4. Verify that the second window doesn't see the first window's conversation
5. Start a new conversation in the second window
6. Verify conversations remain separate

### Test Case 2: IP-based Isolation
1. Test from different IP addresses (different networks/VPNs)
2. Verify that users from different IPs can't see each other's conversations
3. Verify that the same IP with different session tokens creates different sessions

### Test Case 3: Login Transition
1. Start a conversation as an anonymous user
2. Log in to the website
3. Verify that the anonymous conversation is no longer visible
4. Start a new conversation as a logged-in user
5. Log out and verify the logged-in conversation is not visible to anonymous users

### Test Case 4: Session Persistence
1. Start a conversation as an anonymous user
2. Close and reopen the browser (same session)
3. Verify the conversation is still accessible
4. Clear localStorage and refresh
5. Verify a new session is created

## Security Considerations

### Privacy Protection
- IP addresses are hashed, not stored in plain text
- Session tokens are UUIDs, not personally identifiable
- Anonymous identifiers cannot be reverse-engineered to reveal IP addresses

### Session Management
- Session tokens are automatically cleared when users log in
- No cross-contamination between anonymous and authenticated sessions
- Each browser session is completely isolated

### Rate Limiting Considerations
- Anonymous users are still identified uniquely for rate limiting
- Prevents abuse while maintaining privacy
- IP-based identification helps prevent session token manipulation

## Implementation Details

### Database Schema
No changes required to the existing database schema. The fix uses the existing `userId` field in the `LlmCall` model, but populates it with unique anonymous identifiers instead of `null`.

### Browser Compatibility
- Uses `crypto.randomUUID()` when available
- Falls back to custom UUID generation for older browsers
- localStorage is used for session token persistence

### Error Handling
- Graceful fallback if session token generation fails
- Handles cases where localStorage is not available
- Maintains functionality even if IP address cannot be determined

## Monitoring and Debugging

### Logs to Check
- Backend logs will show anonymous user IDs like `anon_a1b2c3d4e5f6g7h8`
- Session token headers in network requests
- Conversation creation/retrieval with proper user isolation

### Debug Information
- Check localStorage for `chatbot-session-token`
- Verify `x-session-token` header in API requests
- Monitor conversation loading for proper isolation

## Future Enhancements

### Potential Improvements
1. **Session Expiration**: Add TTL to session tokens
2. **Enhanced Privacy**: Additional anonymization techniques
3. **Analytics**: Track anonymous session patterns (privacy-compliant)
4. **Rate Limiting**: Per-session rate limiting for anonymous users

### Migration Considerations
- Existing anonymous conversations (with `userId: null`) will remain orphaned
- New anonymous sessions will be properly isolated
- Consider cleanup job for old orphaned conversations 