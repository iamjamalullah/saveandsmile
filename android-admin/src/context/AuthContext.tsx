import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StaffUser } from '../types';
import { authApi } from '../api/endpoints';
import { getAuthToken, setAuthToken } from '../api/client';

interface AuthContextType {
  user: StaffUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const storedToken = await getAuthToken();
      if (!storedToken) {
        setUser(null);
        setTokenState(null);
        setIsLoading(false);
        return;
      }
      setTokenState(storedToken);
      const res = await authApi.getProfile();
      if (res?.user) {
        setUser(res.user);
      } else {
        await setAuthToken(null);
        setUser(null);
        setTokenState(null);
      }
    } catch {
      // If server unreachable or token invalid, allow graceful state
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(identifier, pass);
      await setAuthToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout().catch(() => {});
      await setAuthToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
