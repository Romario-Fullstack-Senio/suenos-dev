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

interface TwoFactorPendingResponse {
  requiresTwoFactor: true;
  tempToken: string;
}

/** `login()` puede terminar la sesión de una (usuario sin 2FA) o pedir un
 * segundo paso — en ese caso el caller (LoginForm) muestra el input de
 * código y llama a `completeTwoFactorLogin`. */
type LoginOutcome = { requiresTwoFactor: false } | { requiresTwoFactor: true; tempToken: string };

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginOutcome>;
  completeTwoFactorLogin: (tempToken: string, codigo: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Actualiza el usuario en memoria + localStorage sin pasar por login —
   * para cuando PerfilForm guarda cambios y hay que reflejarlos ya (el
   * nombre en el header, etc.) sin forzar un logout/login. */
  updateUser: (cambios: Partial<User>) => void;
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

  const finalizarLogin = (result: LoginResponse) => {
    setTokens(result);
    localStorage.setItem('user', JSON.stringify(result.usuario));
    setToken(result.token);
    setUser(result.usuario);

    if (result.usuario.rol === 'admin') router.push('/admin');
    else if (result.usuario.rol === 'instructor') router.push('/instructor');
    else router.push('/dashboard');
  };

  const login = async (email: string, password: string): Promise<LoginOutcome> => {
    const result = await apiPost<LoginResponse | TwoFactorPendingResponse>('/auth/login', { email, password });
    if ('requiresTwoFactor' in result) {
      return { requiresTwoFactor: true, tempToken: result.tempToken };
    }
    finalizarLogin(result);
    return { requiresTwoFactor: false };
  };

  const completeTwoFactorLogin = async (tempToken: string, codigo: string) => {
    const result = await apiPost<LoginResponse>('/auth/2fa/login', { tempToken, codigo });
    finalizarLogin(result);
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

  const updateUser = (cambios: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const actualizado = { ...prev, ...cambios };
      localStorage.setItem('user', JSON.stringify(actualizado));
      return actualizado;
    });
  };

  const isAuthenticated = !!token && !!user;
  const hasRole = (role: string) => user?.rol === role;

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, completeTwoFactorLogin, register, logout, updateUser, isAuthenticated, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
