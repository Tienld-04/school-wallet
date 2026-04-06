import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getToken, setToken as saveToken, removeToken } from '../utils/storage';
import authApi from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  useEffect(() => {
    setIsAuthenticated(!!token);
  }, [token]);

  const login = useCallback(async (phone, password) => {
    const response = await authApi.login({ phone, password });
    const jwt = response.token;
    saveToken(jwt);
    setTokenState(jwt);
    return response;
  }, []);

  const logout = useCallback(async () => {
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

  const value = {
    token,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
