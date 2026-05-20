import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedUser = await storage.getUser();
        const token = await storage.getAccessToken();
        if (savedUser && token) {
          setUser(savedUser);
          // Refresh profile in background
          authApi.getProfile()
            .then(({ data }) => { setUser(data); storage.saveUser(data); })
            .catch(() => {});
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await authApi.login(username, password);
    await storage.saveTokens(data.tokens.access, data.tokens.refresh);
    await storage.saveUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData);
    await storage.saveTokens(data.tokens.access, data.tokens.refresh);
    await storage.saveUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await storage.clearAll();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await authApi.getProfile();
    await storage.saveUser(data);
    setUser(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
