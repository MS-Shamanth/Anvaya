/**
 * Rate limiting middleware for Express routes.
 */

import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../utils/rateLimit.js';

/**
 * Create rate limiting middleware.
 * 
 * @param maxAttempts - Maximum number of attempts
 * @param windowMs - Time window in milliseconds
 * @param keyExtractor - Function to extract rate limit key from request
 */
export function rateLimitMiddleware(
  maxAttempts: number,
  windowMs: number,
  keyExtractor: (req: Request) => string = (req) => req.ip || 'unknown'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyExtractor(req);
    const result = checkRateLimit(key, maxAttempts, windowMs);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxAttempts.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: retryAfter,
        resetAt: new Date(result.resetAt).toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Login rate limiter: 5 attempts per 15 minutes per IP.
 */
export const loginRateLimiter = rateLimitMiddleware(5, 15 * 60 * 1000);

/**
 * Password reset rate limiter: 3 attempts per hour per IP.
 */
export const passwordResetRateLimiter = rateLimitMiddleware(3, 60 * 60 * 1000);

/**
 * Email-based rate limiter for login: 5 attempts per 15 minutes per email.
 */
export function loginEmailRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) {
    next();
    return;
  }

  const key = `login:${email}`;
  const result = checkRateLimit(key, 5, 15 * 60 * 1000);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    res.status(429).json({
      error: 'Too many login attempts for this account',
      retryAfter: retryAfter,
      resetAt: new Date(result.resetAt).toISOString(),
    });
    return;
  }

  next();
}
