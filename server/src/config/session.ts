/**
 * Session configuration for Express.
 */

import session from 'express-session';
import type { SessionOptions } from 'express-session';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Session configuration.
 * 
 * In production:
 * - Use Redis or another persistent store
 * - Set secure: true (requires HTTPS)
 * - Use strong secret from environment variable
 */
export const sessionConfig: SessionOptions = {
  name: 'anvaya.sid', // Session cookie name
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
  },
  // In production, use Redis store:
  // store: new RedisStore({ client: redisClient }),
};

/**
 * Validate session configuration.
 */
export function validateSessionConfig(): void {
  if (isProduction) {
    if (!process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }

    if (process.env.SESSION_SECRET.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters');
    }

    if (process.env.SESSION_SECRET === 'dev-secret-change-in-production') {
      throw new Error('SESSION_SECRET must be changed from default value in production');
    }
  }
}
