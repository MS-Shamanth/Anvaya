/**
 * Password reset token model and operations.
 */

import type { PasswordResetToken } from '../types.js';
import crypto from 'crypto';
import argon2 from 'argon2';

/**
 * In-memory token storage.
 * In production: Store in database with proper indexes.
 */
const tokens: PasswordResetToken[] = [];

/**
 * Generate a cryptographically secure random token.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a token for storage.
 */
export async function hashToken(token: string): Promise<string> {
  return await argon2.hash(token);
}

/**
 * Create a password reset token.
 * Returns the plain token (to be sent via email) and stores the hashed version.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const plainToken = generateToken();
  const tokenHash = await hashToken(plainToken);
  
  const resetToken: PasswordResetToken = {
    id: `rst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    used: false,
    createdAt: new Date(),
  };

  tokens.push(resetToken);
  
  // Clean up expired tokens periodically
  cleanupExpiredTokens();
  
  return plainToken; // Return plain token to be sent to user
}

/**
 * Verify and consume a password reset token.
 * Returns userId if valid, null otherwise.
 */
export async function verifyPasswordResetToken(plainToken: string): Promise<string | null> {
  const now = new Date();
  
  // Find all valid tokens (not used, not expired)
  const validTokens = tokens.filter(t => !t.used && t.expiresAt > now);
  
  for (const storedToken of validTokens) {
    try {
      const isValid = await argon2.verify(storedToken.tokenHash, plainToken);
      if (isValid) {
        // Mark token as used (single-use)
        storedToken.used = true;
        return storedToken.userId;
      }
    } catch (error) {
      // Invalid token format, continue checking others
      continue;
    }
  }
  
  return null;
}

/**
 * Clean up expired or used tokens.
 */
function cleanupExpiredTokens(): void {
  const now = new Date();
  const beforeCount = tokens.length;
  
  // Remove expired or used tokens
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].used || tokens[i].expiresAt < now) {
      tokens.splice(i, 1);
    }
  }
  
  const removed = beforeCount - tokens.length;
  if (removed > 0) {
    console.log(`🧹 Cleaned up ${removed} expired/used password reset tokens`);
  }
}

/**
 * Invalidate all password reset tokens for a user.
 * Used after successful password change.
 */
export function invalidateUserTokens(userId: string): void {
  tokens.forEach(token => {
    if (token.userId === userId) {
      token.used = true;
    }
  });
}
