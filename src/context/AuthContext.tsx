import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
  quickLoginDemo: (role: 'customer' | 'admin') => Promise<void>;
  updateUserProfile: (data: { name?: string; phone?: string }) => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'login' | 'register') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const verifyCurrentSession = useCallback(async () => {
    const stored = getStoredToken();
    if (!stored) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.auth.getMe();
      setUser(response.user);
      setToken(stored);
    } catch {
      // Token is invalid or expired
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyCurrentSession();
  }, [verifyCurrentSession]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.auth.login({ email, password });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    return res.user;
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<User> => {
    const res = await api.auth.register({ name, email, password, phone });
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setIsAuthModalOpen(false);
    return res.user;
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const quickLoginDemo = async (role: 'customer' | 'admin') => {
    if (role === 'admin') {
      await login('admin@shopcart.in', 'AdminPass123!');
    } else {
      await login('rahul.sharma@example.com', 'Password123!');
    }
  };

  const updateUserProfile = async (data: { name?: string; phone?: string }) => {
    const res = await api.auth.updateProfile(data);
    setUser(res.user);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        login,
        register,
        logout,
        quickLoginDemo,
        updateUserProfile,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
