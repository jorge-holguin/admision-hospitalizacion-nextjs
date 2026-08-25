"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, refreshToken, setAuthToken, removeAuthToken, getCurrentUser, UserInfo } from '@/lib/auth';
import { PatientDataProvider } from '@/contexts/PatientDataContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, primerInicio: boolean) => void;
  logout: () => void;
  refreshUserToken: () => Promise<boolean>;
  loading: boolean;
  user: UserInfo | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        // Get user info from token
        const userInfo = getCurrentUser();
        setUser(userInfo);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, primerInicio: boolean) => {
    setAuthToken(token);
    setIsAuthenticated(true);

    // Clear cached permissions from previous user
    try { localStorage.removeItem('s028_permissions'); } catch {}

    // Get user info from token
    const userInfo = getCurrentUser();
    setUser(userInfo);

    // Force PermissionsProvider to remount and reload permissions
    setSessionKey((prev) => prev + 1);

    if (primerInicio) {
      router.push('/change-password');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
    setUser(null);
    try { localStorage.removeItem('s028_permissions'); } catch {}
    router.push('/');
  };

  const refreshUserToken = async (): Promise<boolean> => {
    const currentToken = getAuthToken();
    if (!currentToken) return false;

    const newToken = await refreshToken(currentToken);
    if (newToken) {
      setAuthToken(newToken);
      return true;
    }
    
    logout();
    return false;
  };

  const authContextValue = { isAuthenticated, login, logout, refreshUserToken, loading, user };

  return (
    <AuthContext.Provider value={authContextValue}>
      <PermissionsProvider key={sessionKey}>
        <PatientDataProvider>
          {children}
        </PatientDataProvider>
      </PermissionsProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
