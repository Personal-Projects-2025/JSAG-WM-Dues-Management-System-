import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const currentUser = await authService.getCurrentUser();
          
          // If user doesn't have tenantId but is not a system user, try to refresh token
          if (!currentUser.tenantId && currentUser.role !== 'system') {
            try {
              const refreshed = await authService.refreshToken();
              setUser(refreshed.user);
              if (refreshed.tenant) {
                setTenant(refreshed.tenant);
              }
            } catch (refreshError) {
              // If refresh fails, continue with current user
              if (process.env.NODE_ENV === 'development') {
                console.warn('Token refresh failed:', refreshError);
              }
              setUser(currentUser);
            }
          } else {
            setUser(currentUser);
            if (currentUser.tenant) {
              setTenant(currentUser.tenant);
              localStorage.setItem('tenant', JSON.stringify(currentUser.tenant));
            } else if (currentUser.isSystemUser) {
              setTenant(null);
            } else {
              const storedTenant = authService.getTenant();
              setTenant(storedTenant);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Auth initialization error:', error);
          }
          // Don't logout on error - might be temporary
          const storedUser = authService.getUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser(data.user);
    if (data.tenant) {
      setTenant(data.tenant);
    } else if (data.isSystemUser) {
      // System users don't have tenants
      setTenant(null);
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setTenant(null);
  };

  const value = {
    user,
    tenant,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

