import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'mother' | 'chw' | 'nurse';
}

/**
 * Route guard that ensures:
 *  1. The user is authenticated (has a valid session).
 *  2. The user's role matches `requiredRole` (if specified).
 *
 * If unauthenticated → redirects to `/login`.
 * If wrong role       → redirects to the correct dashboard for their actual role.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Send the user to the dashboard that matches their actual role
    const correctPath =
      user.role === 'mother' ? '/dashboard/mother' :
      user.role === 'chw'    ? '/dashboard/chw' :
      user.role === 'nurse'  ? '/dashboard/nurse' :
      '/login';
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}