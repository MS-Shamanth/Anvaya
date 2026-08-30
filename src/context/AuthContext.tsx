import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role, User } from '../types';
import { SEED_USERS } from '../data/seed';
import { load, save } from '../lib/storage';

/**
 * ⚠️ SECURITY NOTE — Phase 1 demo auth only.
 *
 * There is no password check, no token, no server. Selecting a role simply
 * writes a user id to localStorage, and every "protected" route is a
 * client-side redirect that anyone can bypass with devtools. This is fine for
 * demoing the three-login model, and must be replaced before any real
 * inventory or money touches the platform. What real auth needs:
 *   - a server-side identity provider (session cookie or short-lived JWT)
 *   - server-enforced authorisation on every read and write, since role checks
 *     in the browser are advisory at best
 *   - KYB/KYC for sellers and upcyclers before they can transact
 */

interface AuthValue {
  user: User | null;
  users: User[];
  signInAs: (role: Role) => User | null;
  signInWithEmail: (email: string) => User | null;
  signOut: () => void;
  isRole: (role: Role) => boolean;
  userById: (id: string) => User | undefined;
}

const AuthContext = createContext<AuthValue | null>(null);

/** The accounts offered on the sign-in screen, one per Phase 1 role. */
export const DEMO_LOGINS: Role[] = ['buyer', 'seller', 'upcycler'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const users = SEED_USERS;
  const [userId, setUserId] = useState<string | null>(() => load<string | null>('session', null));

  const persist = useCallback((id: string | null) => {
    setUserId(id);
    save('session', id);
  }, []);

  const value = useMemo<AuthValue>(() => {
    const user = users.find((u) => u.id === userId) ?? null;

    return {
      user,
      users,
      isRole: (role) => user?.role === role,
      userById: (id) => users.find((u) => u.id === id),
      signInAs: (role) => {
        const match = users.find((u) => u.role === role) ?? null;
        persist(match?.id ?? null);
        return match;
      },
      signInWithEmail: (email) => {
        const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) ?? null;
        if (match) persist(match.id);
        return match;
      },
      signOut: () => persist(null),
    };
  }, [userId, users, persist]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
