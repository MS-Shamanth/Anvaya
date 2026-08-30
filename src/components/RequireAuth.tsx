import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../types';
import { useAuth } from '../context/AuthContext';

/**
 * Client-side route guard.
 *
 * ⚠️ This is presentation only. It stops a signed-out visitor from landing on a
 * dashboard, nothing more — anyone can bypass it. Real enforcement has to live
 * on the server, per request. See the note in AuthContext.
 */
export function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/enter" state={{ from: location.pathname }} replace />;
  }

  if (role && user.role !== role) {
    const home = { buyer: '/browse', seller: '/seller', upcycler: '/upcycler' }[user.role];
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
