# Running Anvaya with Secure Authentication

## Quick Start

### Option 1: Run Both Together (Recommended)
```bash
npm run dev:all
```

This starts both backend (port 3001) and frontend (port 5173) together.

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

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
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kabir@anvaya.exchange","password":"anvaya2024"}'
```

### Test Current User (requires session cookie)
```bash
curl http://localhost:3001/api/auth/me \
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

### Session not persisting
**Check**: Cookie in DevTools (Application → Cookies)  
**Check**: HttpOnly flag is set  
**Fix**: Clear all cookies and try again

---

## Development Commands

```bash
# Frontend
npm run dev              # Start frontend dev server
npm run build            # Build frontend for production
npm run preview          # Preview production build
npm run typecheck        # Check TypeScript types

# Backend
npm run server           # Start backend server
npm run server:build     # Build backend for production
npm start:server         # Run production backend

# Both
npm run dev:all          # Start both concurrently
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
