# Running Anvaya with Secure Authentication

## Quick Start

```bash
npm run dev
```

One command, one port. The auth API in `api/` is mounted straight into the Vite dev
server, so `/api/auth` works with nothing else running — the same function Vercel
runs in production (see [DEPLOYMENT.md](DEPLOYMENT.md)).

### Optional: use the Express backend instead

`server/` is the argon2id + `express-session` implementation. To run the frontend
against it:

```bash
npm run dev:express      # vite (proxying /api → :3001) + the Express server
```

`npm run server` starts that backend on its own, and `npm run smoke:api` exercises the
serverless auth contract (login, session, tampering, rate limits) end to end.

---

## Access the Application

1. **Open browser**: http://localhost:5173
2. **Click**: "Enter the exchange"
3. **Login with**:
   - Email: `kabir@anvaya.exchange`
   - Password: `anvaya2024`
4. **You're in!** You'll be redirected to the seller dashboard

---

## Demo Accounts

All accounts use password: **`anvaya2024`**

| Email | Role | What you'll see |
|-------|------|-----------------|
| aditi@anvaya.exchange | buyer | Browse products, add to cart, checkout |
| kabir@anvaya.exchange | seller | Manage inventory, list new products |
| noor@anvaya.exchange | upcycler | Renewal pool, project management |

---

## Verify Security

### 1. Check Session Cookie
1. Login to the app
2. Open DevTools → Application → Cookies → http://localhost:5173
3. Look for `anvaya.sid` cookie
4. Verify flags: `HttpOnly` ✅ `SameSite=Lax` ✅

### 2. Try to Access Cookie from Console
```javascript
document.cookie
// You won't see anvaya.sid because it's HttpOnly
```

### 3. Test Logout
1. Click your profile picture → "Sign out"
2. Try to access a protected page
3. You'll be redirected to login

### 4. Try to Bypass (Won't Work)
```javascript
// Open console and try:
localStorage.setItem('token', 'fake');
// Refresh page - still not logged in
// Authentication requires valid server session
```

---

## API Endpoints

Backend runs on: http://localhost:3001

### Test Login
```bash
# Serverless function (npm run dev, and Vercel)
curl -i -X POST "http://localhost:5173/api/auth?action=login" \
  -H "Content-Type: application/json" \
  -d '{"email":"kabir@anvaya.exchange","password":"anvaya2024"}'

# Express backend (npm run dev:express)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kabir@anvaya.exchange","password":"anvaya2024"}'
```

### Test Current User (requires session cookie)
```bash
curl "http://localhost:5173/api/auth?action=me" \
  -H "Cookie: anvaya.sid=<your-session-cookie>"
```

---

## Project Structure

```
Anvaya/
├── server/              # Backend authentication server
│   ├── src/
│   │   ├── server.ts    # Main server
│   │   ├── routes/      # API endpoints
│   │   ├── models/      # Data models
│   │   ├── middleware/  # Auth & rate limiting
│   │   └── utils/       # Password hashing, etc.
│   └── tsconfig.json
│
├── src/                 # Frontend React app
│   ├── pages/           # Route components
│   ├── components/      # UI components
│   ├── context/         # Auth & store context
│   └── lib/             # Utilities
│
├── .env                 # Environment variables
└── package.json         # Scripts & dependencies
```

---

## Troubleshooting

### Backend won't start
**Error**: Port 3001 already in use  
**Fix**: Kill process on port 3001 or change PORT in .env

**Error**: Missing dependencies  
**Fix**: Run `npm install`

### Frontend can't reach backend
**Check**: Is backend running on port 3001?  
**Check**: Look for "Server: http://localhost:3001" in backend logs

### Login not working
**Check**: Are you using the correct password? `anvaya2024`  
**Check**: Open browser console - any errors?  
**Check**: Backend logs - any errors?

### "Could not reach the sign-in service" / "Network error"
The browser could not get a JSON response from `/api/auth?action=login`.

**Check**: open `/api/health` in the same origin you are using.
- JSON with `"status":"ok"` → the API is up; the failure is credentials or rate limiting.
- HTML → no backend is answering `/api`. Locally, restart `npm run dev`. On Vercel, the
  functions in `api/` were not deployed — see [DEPLOYMENT.md](DEPLOYMENT.md).

**Check**: if you started the frontend with `npm run dev:express`, the Express server on
:3001 has to be running too, otherwise the proxy has nothing to talk to.

### Signed out after every refresh on a deployed build
`SESSION_SECRET` is unset or changed between deploys, so previously issued cookies no
longer verify. Set a stable 32+ character `SESSION_SECRET` in the hosting environment.

### Session not persisting
**Check**: Cookie in DevTools (Application → Cookies)  
**Check**: HttpOnly flag is set  
**Fix**: Clear all cookies and try again

---

## Development Commands

```bash
# App (frontend + api/ handlers in one process)
npm run dev              # Dev server on :5173, /api served in-process
npm run build            # Typecheck (src, api, config) + production bundle
npm run preview          # Preview the built bundle (no /api — deploy for that)
npm run typecheck        # Types only

# Serverless auth checks
npm run smoke:api        # Drives api/auth/* through a local http server

# Express backend (optional, argon2id + express-session)
npm run server           # Backend on :3001
npm run dev:express      # Vite proxying /api → :3001, plus the backend
npm run server:build     # Compile the backend
npm run start:server     # Run the compiled backend
```

---

## Environment Variables

Edit `.env` file:

```bash
# Server port
PORT=3001

# Node environment
NODE_ENV=development

# Session secret (change in production!)
SESSION_SECRET=dev-secret-f8e4a2b6c9d1e3f7a5b8c2d4e6f8a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

---

## Features

### ✅ Secure Authentication
- Argon2id password hashing (64MB, 3 iterations)
- HttpOnly + Secure session cookies
- Server-side validation
- Rate limiting (5 attempts / 15 min)
- Generic error messages
- No password exposure

### ✅ User Roles
- **Buyer**: Browse and purchase items
- **Seller**: Manage inventory
- **Upcycler**: Renewal and restoration

### ✅ Security
- Cannot bypass with localStorage
- Cannot bypass with DevTools
- All validation server-side
- HttpOnly cookies (XSS protection)
- SameSite cookies (CSRF protection)
- Rate limiting (brute force protection)

---

## Next Steps

### For Demo/Testing
- Application is ready to use
- All features working
- Authentication is secure

### For Production
See `BACKEND-AUTH-IMPLEMENTATION.md` for production checklist:
- Change SESSION_SECRET
- Set up HTTPS
- Migrate to PostgreSQL
- Migrate to Redis
- Configure production domain
- Set up email service

---

## Documentation

- **DEPLOYMENT.md** - Vercel deployment, required env vars, known limits
- **PHASE-2-COMPLETE.md** - Complete status report
- **BACKEND-AUTH-IMPLEMENTATION.md** - Technical implementation details
- **AUTHENTICATION.md** - Original authentication docs
- **SECURITY-CHECKLIST.md** - Security requirements

---

## Support

The application is fully functional with production-grade authentication.

Both frontend and backend are running:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Login with any demo account:
- Email: `kabir@anvaya.exchange`
- Password: `anvaya2024`

Enjoy! 🎉
