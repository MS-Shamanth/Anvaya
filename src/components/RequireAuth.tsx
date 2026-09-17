import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../types';
import { useAuth } from '../context/AuthContext';

/**
 * Client-side route guard.
 *
 * Note: This is UI protection only. Real security enforcement happens on the backend.
 * All API requests are validated server-side with session authentication.
 */
export function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Session is still being verified against /api/auth/me. Rendering a redirect
    // here would bounce a signed-in user to /enter on every hard refresh.
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-dvh flex-col items-center justify-center gap-4"
      >
        <span className="loading-spinner inline-block h-8 w-8" />
        <p className="text-mist-500 text-[0.6rem] tracking-[0.28em] uppercase">
          Verifying your session
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/enter" state={{ from: location.pathname }} replace />;
  }

  if (role && user.role !== role) {
    const home = { buyer: '/browse', seller: '/seller', upcycler: '/upcycler' }[user.role];
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
