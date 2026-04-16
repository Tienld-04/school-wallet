import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken as saveToken, removeToken } from '../utils/storage';
import authApi from '../api/authApi';
import userApi from '../api/userApi';
import type { AuthContextType, LoginResponse } from '../types';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [role, setRole] = useState<string | null>(null);

  const fetchRole = useCallback(async () => {
    try {
      const user = await userApi.getInfo();
      setRole(user.role);
    } catch {
      setRole(null);
    }
  }, []);

  useEffect(() => {
    setIsAuthenticated(!!token);
    if (token) {
      fetchRole();
    } else {
      setRole(null);
    }
  }, [token, fetchRole]);

  const login = useCallback(async (phone: string, password: string): Promise<LoginResponse> => {
    const response = await authApi.login({ phone, password });
    saveToken(response.token);
    setTokenState(response.token);
    return response;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const currentToken = getToken();
    if (currentToken) {
      try {
        await authApi.logout(currentToken);
      } catch {
        // ignore logout API error
      }
    }
    removeToken();
    setTokenState(null);
  }, []);

  const value: AuthContextType = { token, isAuthenticated, role, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
