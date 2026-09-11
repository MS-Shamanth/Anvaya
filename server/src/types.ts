/**
 * Backend types for Anvaya authentication system.
 * Shares types with frontend where appropriate but keeps sensitive data server-only.
 */

export type Role = 'buyer' | 'seller' | 'upcycler';

/**
 * User model stored in database.
 * NEVER send passwordHash to the client.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Argon2id hash - NEVER expose to client
  role: Role;
  org: string;
  initials: string;
  memberSince: string;
  standing: 'Invited' | 'Verified' | 'Atelier' | 'Founding';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  interests?: { categories: string[]; brands: string[]; budget: number };
}

/**
 * Safe user data that can be sent to client.
 * Excludes passwordHash and other sensitive fields.
 */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  org: string;
  initials: string;
  memberSince: string;
  standing: 'Invited' | 'Verified' | 'Atelier' | 'Founding';
  interests?: { categories: string[]; brands: string[]; budget: number };
}

/**
 * Password reset token model.
 */
export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string; // Hashed token for security
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

/**
 * Session data stored in express-session.
 */
export interface SessionData {
  userId: string;
  role: Role;
  createdAt: number;
}

/**
 * Extended Express Request with session data.
 */
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: Role;
    createdAt?: number;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
