/**
 * ⚠️ CLIENT-SIDE AUTHENTICATION SIMULATION - NOT SECURE ⚠️
 * 
 * This file simulates authentication flow for UI/UX demonstration purposes ONLY.
 * 
 * SECURITY WARNINGS:
 * - All validation happens in the browser (bypassable via DevTools)
 * - "JWT secret" is in client code (not actually secret)
 * - Tokens stored in localStorage (vulnerable to XSS)
 * - Password hashing is simulated (not real Argon2id/bcrypt)
 * - No backend validation whatsoever
 * 
 * DO NOT USE IN PRODUCTION.
 * 
 * Before production, replace this with:
 * - Backend authentication API (Node.js/Python/Go/etc.)
 * - Real password hashing with Argon2id or bcrypt (server-side)
 * - HttpOnly + Secure cookies (not localStorage)
 * - Server-side session validation on every request
 * - Rate limiting on login attempts
 * - Proper secrets management (environment variables on server)
 * 
 * See AUTHENTICATION.md for complete production requirements.
 */

import type { User } from '../types';

const DEMO_PASSWORD = 'anvaya2024';
const TOKEN_KEY = 'anvaya_token';
const TOKEN_EXPIRY_HOURS = 24;

export interface AuthToken {
  userId: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

/**
 * Validates password (SIMULATED - NOT SECURE).
 * 
 * In production: This MUST be a backend API call:
 *   - Server finds user in database
 *   - Server verifies with argon2.verify(user.passwordHash, password)
 *   - Server creates session and sets HttpOnly cookie
 *   - Client never sees password hash
 */
export function validatePassword(password: string, _passwordHash: string): boolean {
  // Demo: accept the hardcoded password for any account
  // Production: DELETE this function, validate server-side only
  return password === DEMO_PASSWORD;
}

/**
 * Creates a JWT-style token (SIMULATED - NOT SECURE).
 * 
 * In production: This MUST happen on the backend:
 *   - Server generates cryptographically secure session ID
 *   - Server stores session in Redis/database
 *   - Server sets HttpOnly cookie with session ID
 *   - Secret never exposed to client
 */
export function createAuthToken(userId: string): AuthToken {
  const now = Date.now();
  const expiresAt = now + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  
  // Demo signature - NOT cryptographically secure
  // Anyone can read this "secret" in the client bundle
  const signature = btoa(`${userId}:${now}:anvaya-secret-key`);
  
  return {
    userId,
    issuedAt: now,
    expiresAt,
    signature,
  };
}

/**
 * Validates and decodes an auth token.
 * Returns the userId if valid, null if expired or invalid.
 */
export function validateToken(token: AuthToken): string | null {
  const now = Date.now();
  
  // Check expiry
  if (now > token.expiresAt) {
    return null;
  }
  
  // Verify signature (demo - in production verify HMAC)
  const expectedSignature = btoa(`${token.userId}:${token.issuedAt}:anvaya-secret-key`);
  if (token.signature !== expectedSignature) {
    return null;
  }
  
  return token.userId;
}

/**
 * Saves auth token to localStorage (INSECURE).
 * 
 * Security issue: localStorage is readable by any JavaScript, including:
 * - Browser extensions
 * - Malicious scripts (XSS attacks)
 * - Third-party libraries
 * 
 * In production: Use HttpOnly cookies set by backend. They:
 * - Cannot be read by JavaScript
 * - Automatically sent with requests
 * - Protected by Secure + SameSite flags
 */
export function saveAuthToken(token: AuthToken): void {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  } catch (error) {
    console.error('Failed to save auth token:', error);
  }
}

/**
 * Loads auth token from localStorage.
 */
export function loadAuthToken(): AuthToken | null {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    
    const token = JSON.parse(stored) as AuthToken;
    return validateToken(token) ? token : null;
  } catch (error) {
    console.error('Failed to load auth token:', error);
    return null;
  }
}

/**
 * Removes auth token from localStorage.
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
}

/**
 * Checks if token needs refresh (within 1 hour of expiry).
 */
export function shouldRefreshToken(token: AuthToken): boolean {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  return (token.expiresAt - now) < oneHour;
}

/**
 * Refreshes an auth token (extends expiry).
 * In production: this would be a backend API call.
 */
export function refreshAuthToken(token: AuthToken): AuthToken {
  return createAuthToken(token.userId);
}

/**
 * Login attempt with email and password.
 * Returns authenticated user if credentials are valid.
 */
export function attemptLogin(
  email: string,
  password: string,
  users: User[]
): { success: true; user: User; token: AuthToken } | { success: false; error: string } {
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  
  if (!user) {
    return { success: false, error: 'No account found with that email address.' };
  }
  
  if (!validatePassword(password, user.passwordHash)) {
    return { success: false, error: 'Incorrect password.' };
  }
  
  const token = createAuthToken(user.id);
  saveAuthToken(token);
  
  return { success: true, user, token };
}

/**
 * Logout - clears token and session.
 */
export function logout(): void {
  clearAuthToken();
}

/**
 * Gets current authenticated user from token.
 */
export function getCurrentUser(users: User[]): User | null {
  const token = loadAuthToken();
  if (!token) return null;
  
  const userId = validateToken(token);
  if (!userId) {
    clearAuthToken();
    return null;
  }
  
  // Auto-refresh if needed
  if (shouldRefreshToken(token)) {
    const newToken = refreshAuthToken(token);
    saveAuthToken(newToken);
  }
  
  return users.find((u) => u.id === userId) ?? null;
}
