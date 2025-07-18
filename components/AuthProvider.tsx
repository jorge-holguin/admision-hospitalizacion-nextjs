"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, refreshToken, setAuthToken, removeAuthToken, getCurrentUser, UserInfo } from '@/lib/auth';

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
    
    // Get user info from token
    const userInfo = getCurrentUser();
    setUser(userInfo);
    
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

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, refreshUserToken, loading, user }}>
      {children}
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
