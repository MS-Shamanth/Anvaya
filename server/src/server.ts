/**
 * Anvaya Backend Server
 * 
 * Production-grade authentication server with:
 * - Argon2id password hashing
 * - Session-based authentication with HttpOnly cookies
 * - Rate limiting on sensitive endpoints
 * - CORS configuration
 * - Server-side authorization
 */

import 'dotenv/config';
import express, { type Request, Response } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { sessionConfig, validateSessionConfig } from './config/session.js';
import authRoutes from './routes/auth.js';
import { seedUsers } from './models/User.js';

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Validate configuration before starting server.
 */
try {
  validateSessionConfig();
} catch (error) {
  console.error('❌ Configuration error:', error instanceof Error ? error.message : error);
  process.exit(1);
}

/**
 * CORS configuration.
 * In production, restrict to your actual frontend domain.
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * Body parsing middleware.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * Session middleware.
 * Uses secure HttpOnly cookies for authentication.
 */
app.use(session(sessionConfig));

/**
 * Security headers middleware.
 */
app.use((req: Request, res: Response, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection (legacy, but doesn't hurt)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

/**
 * Request logging middleware (development only).
 */
if (!isProduction) {
  app.use((req: Request, res: Response, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

/**
 * Health check endpoint.
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * API routes.
 */
app.use('/api/auth', authRoutes);

/**
 * 404 handler.
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Error handler.
 */
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Start server.
 */
async function startServer() {
  try {
    // Seed demo users
    await seedUsers();
    
    app.listen(PORT, () => {
      console.log('\n🚀 Anvaya Backend Server');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✅ Server is ready');
      console.log('\nDemo accounts (password: anvaya2024):');
      console.log('  - aditi@anvaya.exchange (buyer)');
      console.log('  - kabir@anvaya.exchange (seller)');
      console.log('  - noor@anvaya.exchange (upcycler)');
      console.log('\nAPI Endpoints:');
      console.log('  POST /api/auth/login');
      console.log('  POST /api/auth/logout');
      console.log('  GET  /api/auth/me');
      console.log('  POST /api/auth/forgot-password');
      console.log('  POST /api/auth/reset-password');
      console.log('\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
