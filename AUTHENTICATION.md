# Anvaya Authentication Documentation

## ⚠️ Critical Security Notice

**This is a CLIENT-SIDE PROTOTYPE ONLY.**

The current implementation provides authentication **UI and user flow**, but does **NOT provide secure authentication**. All validation happens in the browser and can be bypassed. This is suitable for:
- ✅ UI/UX demos
- ✅ Prototyping
- ✅ Frontend development

This is **NOT suitable for**:
- ❌ Production deployment
- ❌ Real user accounts
- ❌ Sensitive data
- ❌ Financial transactions

**Before production, you MUST implement backend authentication** as described in the "Production Requirements" section.

---

## Overview

Anvaya's frontend implements a **simulated JWT-style authentication flow** that demonstrates the user experience without providing actual security.

## Current Implementation (Phase 1 - UI Prototype Only)

### ⚠️ What's Actually Included

1. **Password-Based Login UI**
   - Email + password form
   - Client-side validation simulation
   - Demo password: `anvaya2024`
   - **NOT secure** - validation happens in browser

2. **Client-Side Token Simulation**
   - Token creation with expiry (simulated)
   - Browser-based signature (not cryptographically secure)
   - Auto-refresh logic (client-side only)
   - localStorage storage (**vulnerable to XSS**)

3. **Client-Side Session Management**
   - Session restoration on page load
   - Logout clears local state
   - **NOT server-validated**

4. **Role-Based UI Protection**
   - Three roles: `buyer`, `seller`, `upcycler`
   - Route guards (**bypassable via DevTools**)
   - UI-only access control

5. **Demo Mode**
   - Quick login via persona cards (**authentication bypass**)
   - For testing only

### 🚫 What's NOT Included (Critical Missing Pieces)

- ❌ Backend API server
- ❌ Real password hashing (Argon2id/bcrypt)
- ❌ Server-side session validation
- ❌ Secure cookie handling
- ❌ Rate limiting
- ❌ Server-side authorization
- ❌ Token signing with secure secrets
- ❌ XSS protection for tokens
- ❌ Database for user storage

## Demo Accounts

All accounts use the password: **`anvaya2024`**

| Email | Role | Name | Organization |
|-------|------|------|--------------|
| aditi@anvaya.exchange | buyer | Aditi Rao | Rao Family Office |
| kabir@anvaya.exchange | seller | Kabir Mehta | Mehta Luxury Consignment |
| noor@anvaya.exchange | upcycler | Noor Sheikh | Atelier Noor |

## Usage

### Sign In with Credentials

```typescript
import { useAuth } from './context/AuthContext';

function LoginForm() {
  const { signIn } = useAuth();
  
  const handleSubmit = async (email: string, password: string) => {
    const result = await signIn(email, password);
    
    if (result.success) {
      // Navigate to user's home page
    } else {
      // Show error: result.error
    }
  };
}
```

### Sign In Demo Mode

```typescript
const { signInDemo } = useAuth();

// Quick demo login without password
signInDemo('buyer');  // or 'seller' or 'upcycler'
```

### Check Authentication

```typescript
const { user, isAuthenticated, isRole } = useAuth();

if (isAuthenticated) {
  console.log('Current user:', user.name);
}

if (isRole('seller')) {
  // Show seller-specific features
}
```

### Sign Out

```typescript
const { signOut } = useAuth();

signOut(); // Clears token and session
```

### Protected Routes

```tsx
<Route
  path="/seller"
  element={
    <RequireAuth role="seller">
      <SellerDashboard />
    </RequireAuth>
  }
/>
```

## Architecture

### Key Files

- **`src/lib/auth.ts`** - Core authentication utilities (token creation, validation, password checking)
- **`src/context/AuthContext.tsx`** - React context for auth state management
- **`src/components/RequireAuth.tsx`** - Route guard component
- **`src/pages/Enter.tsx`** - Login page with both demo and credential modes

### Authentication Flow

```
User enters email + password
    ↓
attemptLogin() validates credentials
    ↓
createAuthToken() generates JWT-style token
    ↓
saveAuthToken() stores in localStorage
    ↓
AuthContext updates user state
    ↓
User is redirected to role-specific home
```

### Token Structure

```typescript
interface AuthToken {
  userId: string;
  issuedAt: number;      // Unix timestamp
  expiresAt: number;     // Unix timestamp (24 hours)
  signature: string;     // Base64 encoded signature
}
```

### Session Lifecycle

1. **Login**: Token created and stored in localStorage
2. **Page Load**: Token validated, user state restored
3. **Auto-Refresh**: Token refreshed when < 1 hour until expiry
4. **Expiry**: Invalid token triggers logout
5. **Logout**: Token cleared from storage

## Production Requirements

⚠️ **These are REQUIRED, not optional, before production deployment.**

### 1. Backend Authentication API (CRITICAL)

**Required endpoints:**

```typescript
POST   /api/auth/login      // Validate credentials, create session
POST   /api/auth/logout     // Destroy session
POST   /api/auth/refresh    // Extend session (optional)
GET    /api/auth/me         // Get current user
POST   /api/auth/register   // Create new account (future)
POST   /api/auth/reset      // Password reset (future)
```

**Example: Login endpoint (Node.js)**

```javascript
const argon2 = require('argon2');

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Rate limiting should happen here
  
  // Find user in DATABASE (not in frontend bundle)
  const user = await db.users.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Verify password with Argon2id (server-side)
  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    // Log failed attempt, increment counter
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Create server-side session
  req.session.userId = user.id;
  req.session.role = user.role;
  
  // Session ID automatically set in HttpOnly cookie by session middleware
  res.json({ 
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
      // Never send passwordHash to client
    }
  });
});
```

### 2. Real Password Hashing (CRITICAL)

**Use Argon2id (recommended) or bcrypt:**

```javascript
// Hashing a new password (on registration)
const argon2 = require('argon2');

const passwordHash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MB
  timeCost: 3,
  parallelism: 4
});

await db.users.create({
  email,
  passwordHash,  // Store ONLY the hash
  // Never store plain password
});
```

**Why Argon2id over bcrypt:**
- More resistant to GPU/ASIC attacks
- Memory-hard (not just CPU-hard)
- Winner of Password Hashing Competition 2015
- bcrypt is also acceptable if already using it

### 3. Secure Session/Token Storage (CRITICAL)

**Use HttpOnly cookies, NOT localStorage:**

```javascript
// Session middleware configuration (Express + express-session)
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

const redisClient = createClient();
redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,  // From environment variable
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,     // Cannot be accessed by JavaScript
    secure: true,       // HTTPS only
    sameSite: 'lax',   // CSRF protection
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
}));
```

**Why HttpOnly cookies over localStorage:**
- XSS attacks cannot steal HttpOnly cookies
- Cookies automatically sent with requests
- Can be secured with Secure + SameSite flags
- localStorage is readable by any JavaScript (including malicious scripts)

### 4. Server-Side Authorization (CRITICAL)

**Every API endpoint MUST validate session:**

```javascript
// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// Role middleware
function requireRole(role) {
  return (req, res, next) => {
    if (req.session.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Protected endpoints
app.get('/api/seller/listings', requireAuth, requireRole('seller'), async (req, res) => {
  // Only sellers who are authenticated can access
  const listings = await db.listings.find({ sellerId: req.session.userId });
  res.json({ listings });
});
```

**Client-side route guards are UI only - they don't provide security.**

### 5. Rate Limiting (HIGH PRIORITY)

**Prevent brute force attacks:**

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // Login logic
});
```

### 6. Remove Demo Bypass (CRITICAL)

**The persona card instant login must not exist in production:**

```typescript
// In production build, remove this completely:
const enterAs = (role: Role) => {
  signInDemo(role);  // ← This bypasses authentication
  navigate(HOME_FOR[role]);
};

// OR hide behind feature flag:
{process.env.NODE_ENV === 'development' && (
  <button onClick={() => enterAs('buyer')}>Demo Login</button>
)}
```

### 7. Environment Security (CRITICAL)

**Never put secrets in frontend code or environment variables:**

```bash
# .env (backend only, in .gitignore)
DATABASE_URL=postgresql://user:pass@localhost/anvaya
SESSION_SECRET=<strong-random-string-min-32-chars>
REDIS_URL=redis://localhost:6379

# NEVER in Vite .env:
# VITE_JWT_SECRET=...  ← This ships to the browser!
```

### 8. HTTPS/TLS (CRITICAL)

- All production traffic must be HTTPS
- Use Let's Encrypt for free certificates
- Redirect HTTP → HTTPS
- Enable HSTS header

### 9. Additional Security (RECOMMENDED)

- [ ] Password complexity requirements (min 12 chars, mix of types)
- [ ] Email verification on registration
- [ ] Password reset flow with time-limited tokens
- [ ] Account lockout after N failed attempts
- [ ] CAPTCHA after multiple failures
- [ ] MFA/2FA for sensitive operations
- [ ] Audit logging of all auth events
- [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning

## Testing

```bash
# Type check
npm run typecheck

# Build
npm run build

# Dev server
npm run dev
```

### Test Credentials

- **Email**: Any of the demo accounts above
- **Password**: `anvaya2024`

### Test Scenarios

1. ✅ Login with valid credentials
2. ✅ Login with invalid email (shows error)
3. ✅ Login with invalid password (shows error)
4. ✅ Demo login via persona cards
5. ✅ Session persistence across refresh
6. ✅ Token auto-refresh
7. ✅ Token expiry after 24 hours
8. ✅ Logout clears session
9. ✅ Protected routes redirect when not authenticated
10. ✅ Role-based route access

## Migration Path

### Phase 1 → Phase 2

1. Set up backend API (Node.js/Express, Python/FastAPI, etc.)
2. Implement user registration endpoint
3. Add password hashing with bcrypt
4. Generate JWT tokens server-side
5. Replace `src/lib/auth.ts` with API calls
6. Move token validation to middleware
7. Implement refresh token rotation
8. Add HTTP-only cookie support

### Example Backend Integration

```typescript
// Before (Phase 1 - local)
const result = attemptLogin(email, password, users);

// After (Phase 2 - backend)
const result = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'include' // for cookies
});
```

## Security Considerations

### Current Limitations

⚠️ **This is a demonstration system with the following limitations:**

1. **Client-side only** - All validation happens in the browser
2. **Simulated password hashing** - Real bcrypt hashing needs backend
3. **localStorage tokens** - Vulnerable to XSS attacks
4. **No backend validation** - Route guards are advisory only
5. **No rate limiting** - Unlimited login attempts
6. **Demo password** - Shared across all accounts

### Best Practices Implemented

✅ Token expiry mechanism
✅ Signature verification
✅ Auto-refresh before expiry
✅ Secure logout
✅ Role-based access control
✅ Error handling
✅ TypeScript type safety

## Support

For questions or issues related to authentication:

1. Check this documentation
2. Review `src/lib/auth.ts` for implementation details
3. Test with demo credentials
4. Refer to production requirements checklist

---

**Remember**: This is a Phase 1 prototype. Never use this authentication system with real user data, real inventory, or real payments. Always implement proper backend authentication before production deployment.
