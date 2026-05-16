# Device-based Session Governance - Client Integration Guide

## Overview

The agentfabric system now supports device-based session governance. Each client automatically gets a unique, stable device ID that's sent with every auth request, enabling the backend to enforce per-device session limits and track sessions across multiple devices.

## Architecture

### How It Works

1. **Device ID Generation**: On first auth request, a UUID v4 is generated and persisted in `localStorage`
2. **Header Injection**: Every auth request automatically includes the device ID via the `x-device-id` header
3. **Server-side Governance**: Backend enforces per-device limits (default: 2 sessions per device)
4. **Persistence**: Device ID survives page refreshes and browser restarts (until explicitly cleared)

### Client-Side Flow

```
┌─ User Initiates Auth Request ─┐
│                               │
▼                               │
Get/Create Device ID ◄──────────┤
    └─ Generate UUID v4          │
    └─ Store in localStorage      │
                                  │
▼                                 │
Inject x-device-id Header         │
    └─ Add to fetch headers        │
                                  │
▼                                 │
Send Auth Request ────────────────┘
    └─ signUp.email()
    └─ signIn.email()
    └─ getSession()
    └─ etc.

▼

Backend Enforces Governance
    └─ Per-device session limits
    └─ Per-IP session limits
    └─ Global session limits
    └─ Stores deviceId in session record
```

## Usage

### Basic Usage (Automatic)

Once configured, device ID tracking happens automatically:

```typescript
import { authClient } from "@/lib/auth"

// Device ID is automatically sent with this request
const session = await authClient.signIn.email({
  email: "user@example.com",
  password: "password123",
})

// Device ID is also sent with this request
const currentSession = await authClient.getSession()
```

### Accessing the Device ID

```typescript
import { getDeviceId, getOrCreateDeviceId } from "@/lib/device-manager"

// Get current device ID (null if not created yet)
const deviceId = getDeviceId()

// Get or create device ID
const deviceId = getOrCreateDeviceId()

// Display in UI
<p>Your Device ID: {deviceId}</p>
```

### Sign Out with Device Cleanup

```typescript
import { signOut } from "@/lib/auth"

// This also clears the device ID from localStorage
await signOut()
```

## Implementation Details

### Files Added/Modified

#### 1. `web/src/lib/device-manager.ts` (NEW)
Manages device ID lifecycle:
- `getOrCreateDeviceId()` - Get or create stable device ID
- `getDeviceId()` - Get current device ID
- `clearDeviceId()` - Remove device ID from storage

#### 2. `web/src/lib/auth-fetch-interceptor.ts` (NEW)
Creates custom fetch that injects headers:
- `createAuthFetch(baseURL)` - Returns fetch wrapper that adds `x-device-id` header

#### 3. `web/src/lib/auth.ts` (MODIFIED)
Updated auth client configuration:
- Added custom fetch interceptor
- Added `signOut()` helper that clears device ID

#### 4. `web/src/routes/index.tsx` (MODIFIED)
Updated demo route:
- Display current device ID
- Use new `signOut()` function

### How better-auth Client Integration Works

The better-auth client accepts a `fetchOptions` parameter:

```typescript
const authClient = createAuthClient({
  baseURL: "http://localhost:5678",
  basePath: "/api/v1/auth",
  fetchOptions: {
    fetch: createAuthFetch(baseURL), // ← Custom fetch with header injection
  },
})
```

Our custom fetch wrapper:
1. Checks if request is to auth service
2. Gets or creates device ID
3. Adds `x-device-id` header
4. Delegates to native fetch

### localStorage Usage

Device ID is stored in localStorage under the key `agentfabric-device-id`:

```javascript
// In browser console
localStorage.getItem("agentfabric-device-id")
// Output: "550e8400-e29b-41d4-a716-446655440000"
```

**Fallback**: If localStorage is unavailable (private mode, SSR), a new UUID is generated per request (no persistence across requests).

## Backend Integration

### Server Configuration

The backend expects deviceId via:

1. **Header** (Preferred): `x-device-id: <uuid>`
2. **Body** (Legacy): `{ deviceId: "<uuid>" }`

### Environment Variables

```bash
AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE=2    # Sessions per device (default: 2)
AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP=5        # Sessions per IP (default: 5)
```

### Session Policy Modes

The backend has three session policy modes:

1. **keep-latest**: Keep only the most recent session, prune older ones
2. **block-new-login**: Reject new login if limit reached
3. **max-sessions**: Allow up to N sessions, prune oldest when exceeded

Set via: `AGENTFABRIC_AUTH_SESSION_POLICY=keep-latest`

## Security Considerations

### Strengths
- ✅ Stable ID persists across sessions (good for legitimate users)
- ✅ Unique per device (prevents session sharing across devices)
- ✅ Cannot be forged (server validates format and enforces limits)
- ✅ Server-side enforcement (client cannot bypass)

### Limitations
- ⚠️ Clearing localStorage resets device ID (user appears as new device)
- ⚠️ localStorage accessible to all scripts on origin (XSS risk)
- ⚠️ Device ID alone is not a security measure (use alongside IP/fingerprinting)

### Best Practices

1. **Combine with IP Tracking**: Use both device ID and IP address for stronger governance
2. **HTTPS Only**: Always use HTTPS to prevent header spoofing
3. **Rate Limiting**: Configure rate limits per device to prevent brute force
4. **User Education**: Inform users about multi-device session limits
5. **Audit Logging**: Log session creation/termination by device ID

## Testing

### Manual Testing

```typescript
// In browser console

// 1. Sign in on Device A
await authClient.signIn.email({
  email: "test@example.com",
  password: "password",
})
// -> Creates session with Device A's device ID

// 2. Get device ID
const deviceId1 = localStorage.getItem("agentfabric-device-id")
console.log(deviceId1)

// 3. Sign in again (on same device, different window)
// -> If policy=block-new-login and already 2 sessions: Request rejected
// -> If policy=keep-latest: Older session pruned, new one created

// 4. Check device ID persists
const deviceId2 = localStorage.getItem("agentfabric-device-id")
console.log(deviceId1 === deviceId2) // true
```

### Simulating Different Devices

```typescript
// Simulate "Device B" by clearing device ID
localStorage.removeItem("agentfabric-device-id")

// Next auth request will generate new device ID
await authClient.signIn.email({
  email: "test@example.com",
  password: "password",
})
// -> Creates session with new device ID
```

## Troubleshooting

### Device ID not sending

```typescript
// Check if device ID was created
console.log(localStorage.getItem("agentfabric-device-id"))

// If null, create one
import { getOrCreateDeviceId } from "@/lib/device-manager"
const deviceId = getOrCreateDeviceId()
console.log(deviceId)
```

### Sessions being rejected unexpectedly

Check environment variables on backend:
```bash
echo $AGENTFABRIC_AUTH_MAX_SESSIONS_PER_DEVICE  # Should be >= 2
echo $AGENTFABRIC_AUTH_MAX_SESSIONS_PER_IP      # Should be >= 5
```

### Device ID changes between requests

Usually means localStorage is not persistent (private mode). Check browser settings.

## API Reference

### Device Manager (`web/src/lib/device-manager.ts`)

```typescript
// Generate or retrieve stable device ID
function getOrCreateDeviceId(): string

// Get device ID without creating
function getDeviceId(): string | null

// Remove device ID from storage
function clearDeviceId(): void
```

### Auth Client (`web/src/lib/auth.ts`)

```typescript
// Standard better-auth client instance
export const authClient

// Sign out and clear device ID
export async function signOut(): Promise<void>
```

## Migration Guide

If you have existing auth code:

### Before
```typescript
import { authClient } from "@/lib/auth"

await authClient.signOut()
```

### After
```typescript
import { signOut } from "@/lib/auth"

// Use new helper (automatically clears device ID)
await signOut()

// Or continue using authClient for backwards compatibility
// (device ID won't be cleared though)
await authClient.signOut()
```

## Next Steps

1. Deploy database migration: `pnpm -F agentfabric db:migrate`
2. Start backend server with device/IP limits configured
3. Open web client - device ID is auto-generated
4. Test multi-device session limits
5. Monitor logs for governance enforcement

## Questions?

See [Session Governance Documentation](../cli/README.md#session-governance) for backend details.
