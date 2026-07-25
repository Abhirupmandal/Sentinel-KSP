import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AuthGuard Component.
 * 
 * Verifies that a valid JWT token and user profile exist in AuthContext state.
 * If unauthenticated, redirects to /login with original location state for post-login return.
 */
export default function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
