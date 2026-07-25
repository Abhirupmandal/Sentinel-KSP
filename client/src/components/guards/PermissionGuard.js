import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, hasAnyPermission } from '../../lib/permissions';

/**
 * PermissionGuard Component.
 * 
 * Client-side permission guard enforcing RBAC access per route.
 * Evaluates user.role against required permission(s).
 * Redirects to /unauthorized if the user's role lacks the required permission.
 * 
 * Props:
 * - permission: Single required permission string
 * - permissions: Array of permissions (allows if user has ANY of them)
 */
export default function PermissionGuard({ permission, permissions, children }) {
  const { user } = useAuth();
  const role = user?.role;

  let allowed = false;
  if (permission) {
    allowed = hasPermission(role, permission);
  } else if (permissions && permissions.length > 0) {
    allowed = hasAnyPermission(role, permissions);
  } else {
    allowed = true; // No permission specified, default allow
  }

  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
