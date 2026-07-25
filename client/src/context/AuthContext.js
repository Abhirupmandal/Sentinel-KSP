import { createContext, useContext, useState, useEffect } from 'react';
import { authClient } from '../lib/api/authClient';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../lib/api/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  const login = async (employeeId, password) => {
    const data = await authClient.login(employeeId, password);
    const tokenStr = data.data.token;
    const officerObj = data.data.officer;

    setToken(tokenStr);
    setUser(officerObj);
    return data.data;
  };

  const logout = async () => {
    try {
      if (token) {
        await authClient.logout();
      }
    } catch (err) {
      console.warn('Logout request failed:', err.message);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
