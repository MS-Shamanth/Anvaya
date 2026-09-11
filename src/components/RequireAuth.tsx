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
    // Show loading state while checking authentication
    return <div>Loading...</div>;
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
