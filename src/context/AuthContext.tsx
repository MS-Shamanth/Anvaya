import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role, User } from '../types';
import { SEED_USERS } from '../data/seed';

/**
 * Authentication context for Anvaya.
 *
 * Authentication is server-authoritative. The frontend holds user state for the
 * UI only; every protected operation is validated again on the server.
 *
 * Two backends implement the same contract:
 * - local development: server/src (Express, argon2id, express-session)
 * - deployed (Vercel):  api/ (scrypt, HMAC-signed HttpOnly session cookie)
 */

export interface SignInResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isRole: (role: Role) => boolean;
  /** Public directory lookup for display purposes (seller/atelier attribution). */
  userById: (id: string) => User | undefined;
}

const AuthContext = createContext<AuthValue | null>(null);

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * All auth actions are served by one function at /api/auth (see api/auth.ts).
 * Calling it with ?action=… hits the function's own path, so it does not depend on
 * a rewrite or a dynamic route segment resolving correctly on the host.
 */
const authUrl = (action: 'login' | 'logout' | 'me' | 'forgot-password' | 'reset-password') =>
  `/api/auth?action=${action}`;

/**
 * Public directory of accounts trading on the exchange. Display metadata only —
 * no credentials — used to attribute listings to a house. Authentication never
 * reads from here; that is the backend's job.
 */
const DIRECTORY: User[] = SEED_USERS;

/** Reads JSON without throwing when the response is HTML, empty, or truncated. */
async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const text = await response.text();
    if (!text.trim()) return null;
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function errorFrom(payload: Record<string, unknown> | null, status: number): string {
  if (payload && typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error;
  }

  // No JSON body means the request never reached our handler — a missing or
  // crashed deployment rather than a credentials problem. Say which, because the
  // fix is completely different.
  if (status === 404 || status === 405) {
    return 'Sign-in service was not found at /api/auth. The backend is not deployed for this build.';
  }
  if (status >= 500) {
    return `The sign-in function failed to run (HTTP ${status}). Check the deployment's runtime logs.`;
  }
  return `Sign-in failed (HTTP ${status}).`;
}

function fetchWithTimeout(input: string, init: RequestInit = {}): Promise<Response> {
  // AbortSignal.timeout is not in every target browser; fall back to a controller.
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    window.clearTimeout(timer);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Restores session state from the session cookie. */
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetchWithTimeout(authUrl('me'), { credentials: 'include' });

      if (response.ok) {
        const data = await readJson(response);
        setUser((data?.user as User | undefined) ?? null);
      } else {
        // 401 is the normal "not signed in" answer, not an error worth logging.
        setUser(null);
      }
    } catch {
      // Offline or backend unreachable: stay signed out rather than guessing.
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      const response = await fetchWithTimeout(authUrl('login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await readJson(response);

      if (response.ok && data?.user) {
        const signedIn = data.user as User;
        setUser(signedIn);
        return { success: true, user: signedIn };
      }

      if (response.ok && !data?.user) {
        return {
          success: false,
          error: 'Sign-in returned an unexpected response. Please try again.',
        };
      }

      return { success: false, error: errorFrom(data, response.status) };
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      return {
        success: false,
        error: aborted
          ? 'Sign-in timed out. Please try again.'
          : 'Could not reach the sign-in service. Check your connection and try again.',
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetchWithTimeout(authUrl('logout'), { method: 'POST', credentials: 'include' });
    } catch {
      // Clearing local state matters more than the round trip succeeding.
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      signIn,
      signOut,
      refreshUser,
      isRole: (role) => user?.role === role,
      userById: (id) => DIRECTORY.find((entry) => entry.id === id),
    }),
    [user, isLoading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

