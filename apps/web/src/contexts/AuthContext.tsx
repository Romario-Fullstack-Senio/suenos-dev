'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'estudiante' | 'instructor' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiPost<{ token: string; usuario: User }>('/auth/login', { email, password });
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.usuario));
    setToken(result.token);
    setUser(result.usuario);

    if (result.usuario.rol === 'admin') router.push('/admin');
    else if (result.usuario.rol === 'instructor') router.push('/instructor');
    else router.push('/dashboard');
  };

  const register = async (nombre: string, email: string, password: string) => {
    await apiPost('/auth/registro', { nombre, email, password });
    router.push('/auth/login');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const isAuthenticated = !!token && !!user;
  const hasRole = (role: string) => user?.rol === role;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
