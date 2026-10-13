import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { initSocket, disconnectSocket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AUTH INIT] starting session restoration');
      const savedToken = localStorage.getItem('token');

      // Step 1: If we have a stored token, try restoring session via /api/auth/me
      if (savedToken) {
        try {
          console.log('[AUTH INIT] verifying stored token with /api/auth/me');
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setToken(savedToken);
            setCurrentUser(res.data.user);
            setIsAuthenticated(true);
            initSocket(savedToken);
            setLoading(false);
            console.log('[AUTH INIT] session restored successfully from token');
            return;
          }
        } catch (meError) {
          console.log('[AUTH INIT] /api/auth/me failed, attempting token refresh...');
        }
      }

      // Step 2: If no stored token or /api/auth/me failed, fallback to /api/auth/refresh (cookie)
      try {
        console.log('[AUTH INIT] calling /api/auth/refresh');
        const res = await api.post('/auth/refresh');
        if (res.data.success && res.data.token) {
          localStorage.setItem('token', res.data.token);
          setToken(res.data.token);
          setCurrentUser(res.data.user);
          setIsAuthenticated(true);
          initSocket(res.data.token);
          console.log('[AUTH INIT] session restored from refresh cookie');
        }
      } catch (error) {
        if (error.response) {
          console.log(`[AUTH REFRESH] status: ${error.response.status}`);
        } else {
          console.log('[AUTH REFRESH] network error');
        }
        localStorage.removeItem('token');
        setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
        disconnectSocket();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setCurrentUser(res.data.user);
      setIsAuthenticated(true);
      initSocket(res.data.token);
      return res.data;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    disconnectSocket();
  };

  const updateUser = (updatedUser) => {
    setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        updateUser,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
