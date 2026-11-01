import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken as saveToken, removeToken } from '../utils/storage';
import { setUnauthorizedHandler } from '../api/axiosClient';
import authApi from '../api/authApi';
import userApi from '../api/userApi';
import type { AuthContextType, LoginResponse, UserResponse } from '../types';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await userApi.getInfo();
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  const clearSession = useCallback(async () => {
    await removeToken();
    setTokenState(null);
  }, []);

  useEffect(() => {
    getToken()
      .then(setTokenState)
      .catch(() => setTokenState(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setUser(null);
    }
  }, [token, refreshUser]);

  const login = useCallback(async (phone: string, password: string): Promise<LoginResponse> => {
    const response = await authApi.login({ phone, password });
    await saveToken(response.token);
    setTokenState(response.token);
    return response;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (token) {
      try {
        await authApi.logout(token);
      } catch {
        // ignore logout API error
      }
    }
    await clearSession();
  }, [token, clearSession]);

  const value: AuthContextType = {
    token,
    isLoading,
    isAuthenticated: !!token,
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
