import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AccountStateGuard Component.
 * 
 * Verifies that the authenticated officer's account_state is 'Active' or 'Pending Activation'.
 * If the account state is restricted (Locked, Disabled, Retired, Under Investigation, Expired),
 * redirects to /account-restricted.
 */
export default function AccountStateGuard({ children }) {
  const { user } = useAuth();
  const accountState = user?.account_state || user?.accountState || 'Active';

  const RESTRICTED_STATES = ['Locked', 'Disabled', 'Retired', 'Under Investigation', 'Expired'];

  if (RESTRICTED_STATES.includes(accountState)) {
    return <Navigate to="/account-restricted" replace />;
  }

  return children;
}
