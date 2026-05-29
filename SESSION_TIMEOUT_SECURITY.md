# Session Timeout Security Implementation

## Overview

This document describes the session timeout security system implemented for admin and partnership protected areas. The system automatically expires user sessions after a period of inactivity and requires re-authentication to regain access.

## Features

### 1. Automatic Session Expiration
- **Inactivity Timeout**: 30 minutes (configurable)
- **Session expires** after the specified inactivity period
- **User must re-login** to access protected routes

### 2. Automatic Session Extension on Activity
- User activity resets the inactivity timer
- **Activity events tracked**:
  - Mouse clicks
  - Keyboard input
  - Scrolling
  - Touch events
- **No interruption** during normal use

### 3. Session Timeout Warning
- **2 minutes before expiration**: Warning modal appears
- Shows countdown timer in `MM:SS` format
- User can:
  - **"Continue Session"** - extends session
  - **"Logout Now"** - immediately log out
- Auto-logout if user doesn't respond

### 4. 401 Unauthorized Response
- Expired tokens return **401 Unauthorized**
- All protected routes reject expired sessions
- Auto-redirect to login page

## Architecture

### Frontend Components

#### 1. SessionService (`src/services/SessionService.ts`)
Core session management service:
```typescript
SessionService.resetInactivityTimer() // Reset on activity
SessionService.extendSession() // Refresh token
SessionService.expireSession() // Force logout
SessionService.setCallbacks() // Set warning/expire handlers
```

**Configuration**:
- `INACTIVITY_LIMIT`: 30 minutes (1800000 ms)
- `WARNING_TIME`: 2 minutes before timeout (120000 ms)

#### 2. useSessionTimeout Hook (`src/hooks/useSessionTimeout.ts`)
React hook for session timeout management:
- Initializes activity listeners
- Manages warning state and countdown
- Handles session expiration
- Tracks time remaining

**Usage**:
```typescript
const { showWarning, timeLeft, handleExtendSession } = useSessionTimeout()
```

#### 3. SessionTimeoutWarning Component (`src/components/SessionTimeoutWarning.tsx`)
Modal warning displayed before session expiration:
- Shows countdown timer
- "Continue Session" button to extend
- "Logout Now" button for immediate logout
- Cannot be dismissed manually

#### 4. CollapsibleSide Layout (`src/components/layouts/PostLoginLayout/components/CollapsibleSide.tsx`)
Main protected layout:
- Integrates session timeout hook
- Renders warning modal
- Applies to all protected routes

### Backend Components

#### 1. validateSession Middleware (`src/server/middleware/validateSession.ts`)
JWT validation middleware:
- Verifies token validity
- Checks expiration time
- Returns **401** for expired/invalid tokens
- Extracts user info from token

**Usage**:
```typescript
app.post('/api/auth/refresh', validateSession, handler)
```

#### 2. Token Refresh Endpoint (`src/server/index.ts`)
`POST /api/auth/refresh`
- Validates current token
- Issues new token with extended expiration
- Maintains user info and role
- Returns new token for frontend storage

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "message": "Session extended successfully"
}
```

#### 3. API Interceptor (`src/services/ApiService.ts`)
Axios interceptor configuration:
- Attaches token to all requests
- Handles 401 responses
- Redirects to login on expiration

## Flow Diagram

```
User Login
    ↓
Token Generated (30m expiration)
    ↓
Session Timer Starts (30m inactivity limit)
    ↓
User Activity?
    ├─ Yes → Reset Timer → Continue Using App
    │         ↑
    │         └─ (Activity detected: keyboard, mouse, scroll, touch)
    │
    └─ No → 28min elapsed
             ↓
             Warning Modal Shows (2min countdown)
             ↓
             User Action?
             ├─ "Continue Session" → POST /api/auth/refresh
             │                        ↓
             │                        New Token Generated
             │                        ↓
             │                        Session Extended
             │                        ↓
             │                        Continue Working
             │
             └─ Timeout / "Logout Now" → Session Expires
                                         ↓
                                         Clear Credentials
                                         ↓
                                         Redirect to Login (/)
```

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=30m  # Token expiration (30 minutes recommended)

# API
VITE_API_BASE_URL=http://localhost:5000/api
```

### Session Timeout Settings

Located in `src/services/SessionService.ts`:

```typescript
const INACTIVITY_LIMIT = 30 * 60 * 1000  // 30 minutes
const WARNING_TIME = 2 * 60 * 1000        // 2 minutes before timeout
```

**To change**:
1. Update both constants
2. Ensure `JWT_EXPIRES_IN` ≥ `INACTIVITY_LIMIT`
3. Test thoroughly

## Protected Routes

All routes under the following are protected:
- `/dashboard`
- `/users`
- `/candidates`
- `/partnership`
- `/job`
- `/employee-request`
- `/license-info`
- `/setting`

**Non-protected routes**:
- `/sign-in`
- `/sign-up`
- `/health`

## User Experience

### Scenario 1: Active User
```
User logs in → Uses app actively → Timer resets on each action
→ No interruption → Can work indefinitely as long as active
```

### Scenario 2: Inactive User
```
User logs in → Becomes inactive → Timer counts down 28 minutes
→ Warning modal appears → User clicks "Continue Session"
→ Session extends → Can continue working
```

### Scenario 3: Timeout Without Action
```
User logs in → Becomes inactive → Timer counts down 30 minutes
→ Warning modal ignored → Session expires → Redirected to login
```

## API Responses

### Success: Token Refresh
```
Status: 200 OK
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Session extended successfully"
}
```

### Error: Session Expired
```
Status: 401 Unauthorized
{
  "error": "Session expired"
}
```

### Error: Invalid Token
```
Status: 401 Unauthorized
{
  "error": "Invalid token"
}
```

## Security Considerations

### Token Storage
- **localStorage**: Used for persistence across page refreshes
- **Cookies**: Optional for secure transmission
- **Tokens cleared** on logout/expiration

### HTTPS Requirement
- In production, always use **HTTPS**
- Set `Secure` flag on cookies
- Use `HttpOnly` flag for sensitive cookies (optional enhancement)

### Logout Endpoints
- Clear local storage
- Clear cookies
- Invalidate token on server (optional)

## Testing

### Manual Testing

1. **Login and verify session starts**:
   ```
   Login → Check localStorage for token
   ```

2. **Activity resets timer**:
   ```
   Login → Wait 5 minutes → Click mouse → Should reset timer
   ```

3. **Warning modal appears**:
   ```
   Login → Go inactive → After 28 minutes → Warning should appear
   ```

4. **Extend session**:
   ```
   Wait for warning → Click "Continue Session" → Session extends
   ```

5. **Auto logout**:
   ```
   Wait for warning → Don't click anything → After 2 minutes → Auto logout
   ```

6. **Token refresh works**:
   ```
   Warning modal → "Continue Session" → New token issued → Verified in localStorage
   ```

### Unit Tests (Example)

```typescript
describe('SessionService', () => {
  test('should reset inactivity timer on activity', () => {
    SessionService.resetInactivityTimer()
    // Mock timer and verify it's reset
  })

  test('should extend session with new token', async () => {
    const extended = await SessionService.extendSession()
    expect(extended).toBe(true)
    expect(localStorage.getItem('token')).toBeDefined()
  })

  test('should expire session on timeout', () => {
    SessionService.expireSession()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
```

## Troubleshooting

### Issue: Session expires immediately
**Solution**: Check `JWT_EXPIRES_IN` in environment variables. Ensure it's set to valid duration (e.g., "30m").

### Issue: Warning modal doesn't appear
**Solution**: Verify `useSessionTimeout` hook is mounted in PostLoginLayout. Check browser console for errors.

### Issue: Token refresh fails (401)
**Solution**: 
1. Verify `/api/auth/refresh` endpoint is implemented
2. Check middleware is applied
3. Verify token format in Authorization header: `Bearer <token>`

### Issue: Activity isn't resetting timer
**Solution**: Check that event listeners are attached. Verify events: `mousedown`, `keydown`, `scroll`, `touchstart`, `click`.

## Future Enhancements

1. **Refresh Token Rotation**: Implement separate refresh tokens
2. **Multi-Device Sessions**: Track and manage multiple device sessions
3. **Session History**: Log session events for audit trails
4. **Persistent Activity Logging**: Store user activity in database
5. **Configurable Timeout per Role**: Different timeouts for admin vs partnership users
6. **Session Persistence**: Survive browser restarts with secure refresh tokens

## Support

For issues or questions:
1. Check logs in browser console
2. Verify environment variables are set correctly
3. Test with network tab open in DevTools
4. Review server logs for 401 errors
