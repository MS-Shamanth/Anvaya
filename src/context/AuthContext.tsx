import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role, User } from '../types';

/**
 * Authentication Context for Anvaya.
 *
 * Now integrated with secure backend authentication:
 * - Server-side password hashing with Argon2id
 * - HttpOnly + Secure session cookies
 * - Server-side authorization on every request
 * - Rate limiting on login attempts
 * - CSRF protection via SameSite cookies
 *
 * The frontend maintains user state but authentication is server-authoritative.
 */

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isRole: (role: Role) => boolean;
  userById: (id: string) => User | undefined; // For backward compatibility with existing components
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Safe user type (without sensitive fields).
 */
type SafeUser = Omit<User, 'passwordHash'>;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch current authenticated user from backend.
   */
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Send cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize auth state on mount.
   */
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Sign in with email and password.
   */
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send/receive cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true };
      }

      // Handle rate limiting
      if (response.status === 429) {
        return { 
          success: false, 
          error: data.error || 'Too many login attempts. Please try again later.',
        };
      }

      return { 
        success: false, 
        error: data.error || 'Login failed. Please try again.',
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection.',
      };
    }
  }, []);

  /**
   * Sign out.
   */
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user: user as User | null,
    isAuthenticated: user !== null,
    isLoading,
    signIn,
    signOut,
    refreshUser,
    isRole: (role) => user?.role === role,
    userById: () => undefined, // Stub - in production, fetch from backend API
  }), [user, isLoading, signIn, signOut, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
