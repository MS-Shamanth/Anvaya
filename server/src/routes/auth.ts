/**
 * Authentication routes.
 * 
 * Endpoints:
 * - POST /api/auth/login - Authenticate user
 * - POST /api/auth/logout - Destroy session
 * - GET /api/auth/me - Get current authenticated user
 * - POST /api/auth/forgot-password - Request password reset
 * - POST /api/auth/reset-password - Reset password with token
 */

import { Router, type Request, Response } from 'express';
import { findUserByEmail, toSafeUser, updateUserPassword } from '../models/User.js';
import { verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { resetRateLimit } from '../utils/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import {
  loginRateLimiter,
  loginEmailRateLimiter,
  passwordResetRateLimiter,
} from '../middleware/rateLimitMiddleware.js';
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
  invalidateUserTokens,
} from '../models/PasswordReset.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with email and password.
 */
router.post('/login', loginRateLimiter, loginEmailRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await findUserByEmail(email);
    
    // Generic error for security (don't reveal if email exists)
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(user.passwordHash, password);
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Create session
    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.createdAt = Date.now();

    // Reset rate limit on successful login
    resetRateLimit(req.ip || 'unknown');
    resetRateLimit(`login:${email.toLowerCase().trim()}`);

    // Return safe user data
    res.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Destroy current session.
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    
    res.clearCookie('anvaya.sid'); // Clear session cookie
    res.json({ message: 'Logged out successfully' });
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user.
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  // User already loaded by requireAuth middleware
  res.json({ user: req.user });
});

/**
 * POST /api/auth/forgot-password
 * Request password reset token.
 */
router.post('/forgot-password', passwordResetRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Always return success (don't reveal if email exists)
    const user = await findUserByEmail(email);
    
    if (user) {
      // Generate reset token
      const token = await createPasswordResetToken(user.id);
      
      // In production: Send email with reset link
      // For development: Log token to console
      console.log('\n🔑 Password Reset Token for', email);
      console.log('Token:', token);
      console.log('Reset URL:', `http://localhost:5173/reset-password?token=${token}`);
      console.log('Expires in: 1 hour\n');
    }

    // Always return generic success message
    res.json({ 
      message: 'If an account exists with that email, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using token.
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // Verify token
    const userId = await verifyPasswordResetToken(token);
    
    if (!userId) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    // Update password
    const success = await updateUserPassword(userId, newPassword);
    
    if (!success) {
      res.status(500).json({ error: 'Failed to update password' });
      return;
    }

    // Invalidate all reset tokens for this user
    invalidateUserTokens(userId);

    // TODO: In production, also invalidate all active sessions for security
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
