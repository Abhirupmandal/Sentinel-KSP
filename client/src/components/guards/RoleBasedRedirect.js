import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleLandingRoute } from '../../lib/permissions';

/**
 * RoleBasedRedirect Component.
 * 
 * Used on index / root paths to seamlessly redirect authenticated officers
 * to their primary operational landing workspace based on their role.
 */
export default function RoleBasedRedirect() {
  const { user } = useAuth();
  const targetRoute = getRoleLandingRoute(user?.role);

  return <Navigate to={targetRoute} replace />;
}
