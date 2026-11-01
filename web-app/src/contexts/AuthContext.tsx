import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken as saveToken, removeToken } from '../utils/storage';
import authApi from '../api/authApi';
import userApi from '../api/userApi';
import type { AuthContextType, LoginResponse, UserResponse } from '../types';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [user, setUser] = useState<UserResponse | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await userApi.getInfo();
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setIsAuthenticated(!!token);
    if (token) {
      refreshUser();
    } else {
      setUser(null);
    }
  }, [token, refreshUser]);

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

  const value: AuthContextType = {
    token,
    isAuthenticated,
    role: user?.role ?? null,
    user,
    refreshUser,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
