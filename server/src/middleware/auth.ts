/**
 * Authentication and authorization middleware.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../types.js';
import { findUserById, toSafeUser } from '../models/User.js';

/**
 * Middleware to require authentication.
 * Checks if user has valid session and loads user data.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Load user from database
  const user = await findUserById(req.session.userId);
  
  if (!user) {
    // Session exists but user not found (e.g., user deleted)
    req.session.destroy(() => {});
    res.status(401).json({ error: 'User not found' });
    return;
  }

  // Attach safe user data to request
  req.user = toSafeUser(user);
  next();
}

/**
 * Middleware to require specific role.
 * Must be used after requireAuth.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Middleware to optionally load authenticated user.
 * Does not require authentication, but loads user if session exists.
 */
export async function loadUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.session.userId) {
    const user = await findUserById(req.session.userId);
    if (user) {
      req.user = toSafeUser(user);
    }
  }
  next();
}
