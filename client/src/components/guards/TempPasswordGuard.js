import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * TempPasswordGuard Component.
 * 
 * Enforces Auth PRD §5 (First Login Forced Password Change).
 * If user.temp_password_flag is true, intercepts navigation and redirects to /change-password.
 */
export default function TempPasswordGuard({ children }) {
  const { user } = useAuth();
  const isTemp = Boolean(user?.temp_password_flag);

  if (isTemp) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}
