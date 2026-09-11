/**
 * Authentication API tests.
 * 
 * Tests all authentication endpoints and security requirements.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_URL = 'http://localhost:3001';

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'kabir@anvaya.exchange',
          password: 'anvaya2024',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('kabir@anvaya.exchange');
      expect(data.user.role).toBe('seller');
      expect(data.user.passwordHash).toBeUndefined(); // Must not expose password hash
    });

    it('should fail with wrong password', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'kabir@anvaya.exchange',
          password: 'wrongpassword',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid email or password');
    });

    it('should fail with non-existent email', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'anvaya2024',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid email or password'); // Generic error (don't reveal if email exists)
    });

    it('should fail with missing credentials', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should set HttpOnly cookie on successful login', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'aditi@anvaya.exchange',
          password: 'anvaya2024',
        }),
      });

      expect(response.status).toBe(200);
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toBeDefined();
      expect(cookies).toContain('anvaya.sid');
      expect(cookies).toContain('HttpOnly');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      // Login first
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'noor@anvaya.exchange',
          password: 'anvaya2024',
        }),
      });

      const cookies = loginResponse.headers.get('set-cookie');
      
      // Get current user
      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Cookie: cookies || '' },
      });

      expect(meResponse.status).toBe(200);
      const data = await meResponse.json();
      expect(data.user.email).toBe('noor@anvaya.exchange');
      expect(data.user.role).toBe('upcycler');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await fetch(`${API_URL}/api/auth/me`);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // Login first
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'kabir@anvaya.exchange',
          password: 'anvaya2024',
        }),
      });

      const cookies = loginResponse.headers.get('set-cookie');
      
      // Logout
      const logoutResponse = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: cookies || '' },
      });

      expect(logoutResponse.status).toBe(200);
      
      // Verify session is destroyed
      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Cookie: cookies || '' },
      });

      expect(meResponse.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit after 5 login attempts', async () => {
      const attempts = [];
      
      // Make 6 failed login attempts
      for (let i = 0; i < 6; i++) {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'ratelimit@test.com',
            password: 'wrong',
          }),
        });
        
        attempts.push(response.status);
      }

      // First 5 should be 401 (wrong password), 6th should be 429 (rate limited)
      expect(attempts.slice(0, 5).every(s => s === 401)).toBe(true);
      expect(attempts[5]).toBe(429);
    });
  });
});

describe('Password Reset', () => {
  describe('POST /api/auth/forgot-password', () => {
    it('should return success regardless of email existence', async () => {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'kabir@anvaya.exchange',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBeDefined();
    });

    it('should return generic success for non-existent email', async () => {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      });

      expect(response.status).toBe(200); // Don't reveal if email exists
    });
  });
});

console.log('\n📋 Authentication Test Suite');
console.log('Testing endpoints: /api/auth/login, /api/auth/logout, /api/auth/me');
console.log('Run server first: npm run server\n');
