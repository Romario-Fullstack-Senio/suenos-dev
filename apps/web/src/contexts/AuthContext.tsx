'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, setTokens, clearTokens } from '@/lib/api';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'estudiante' | 'instructor' | 'admin';
  emailVerificado: boolean;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  sessionToken: string;
  usuario: User;
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
    const result = await apiPost<LoginResponse>('/auth/login', { email, password });
    setTokens(result);
    localStorage.setItem('user', JSON.stringify(result.usuario));
    setToken(result.token);
    setUser(result.usuario);

    if (result.usuario.rol === 'admin') router.push('/admin');
    else if (result.usuario.rol === 'instructor') router.push('/instructor');
    else router.push('/dashboard');
  };

  const register = async (nombre: string, email: string, password: string) => {
    await apiPost('/auth/registro', { nombre, email, password });
    router.push('/auth/login?registrado=1');
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      // Best-effort — revoca la sesión server-side, pero no bloquea el
      // logout local si la API no responde (ya limpiamos los tokens igual).
      apiPost('/auth/logout', { refreshToken }).catch(() => {});
    }
    clearTokens();
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
