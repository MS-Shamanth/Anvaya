/**
 * Password hashing and verification utilities using Argon2id.
 * 
 * Argon2id is the recommended password hashing algorithm:
 * - Memory-hard (resistant to GPU attacks)
 * - Configurable time and memory costs
 * - Winner of Password Hashing Competition 2015
 */

import argon2 from 'argon2';

/**
 * Argon2id configuration.
 * 
 * These values provide strong security while maintaining reasonable performance.
 * Adjust based on your server capabilities and security requirements.
 */
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 parallel threads
};

/**
 * Hash a password using Argon2id.
 * 
 * @param password - Plain text password
 * @returns Argon2id hash string
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  return await argon2.hash(password, HASH_OPTIONS);
}

/**
 * Verify a password against its Argon2id hash.
 * 
 * @param hash - Stored Argon2id hash
 * @param password - Plain text password to verify
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    // Invalid hash format or verification error
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Check if password meets minimum requirements.
 * 
 * Requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * 
 * @param password - Password to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

/**
 * For development/demo only: Check if this is the demo password.
 * Remove this in production.
 */
export function isDemoPassword(password: string): boolean {
  return password === 'anvaya2024';
}
