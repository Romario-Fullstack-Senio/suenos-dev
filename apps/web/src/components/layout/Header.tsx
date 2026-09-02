'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from './NotificationBell';
import {
  Cloud,
  LayoutDashboard,
  BookOpen,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-suenos-midnight/80 backdrop-blur-xl border-b border-suenos-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-suenos-violet to-suenos-cyan flex items-center justify-center transition-shadow duration-300 group-hover:shadow-[0_0_16px_rgba(124,58,237,0.6)]">
            <Cloud className="w-5 h-5 text-white fill-white/20" strokeWidth={2} />
          </div>
          <span className="font-display text-lg font-bold">
            <span className="text-suenos-text">Sueños</span>
            <span className="text-suenos-violet-light"> Dev</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/cursos" className="btn-ghost text-sm">
            <BookOpen className="w-4 h-4 inline mr-1.5" />
            Cursos
          </Link>

          {isAuthenticated ? (
            <>
              {hasRole('estudiante') && (
                <Link href="/dashboard" className="btn-ghost text-sm">
                  <LayoutDashboard className="w-4 h-4 inline mr-1.5" />
                  Mis Cursos
                </Link>
              )}
              {hasRole('instructor') && (
                <Link href="/instructor" className="btn-ghost text-sm">
                  <BookOpen className="w-4 h-4 inline mr-1.5" />
                  Instructor
                </Link>
              )}
              {hasRole('admin') && (
                <Link href="/admin" className="btn-ghost text-sm">
                  <Shield className="w-4 h-4 inline mr-1.5" />
                  Admin
                </Link>
              )}

              <div className="w-px h-6 bg-suenos-border mx-2" />

              <NotificationBell />

              <Link href="/perfil" className="flex items-center gap-2 ml-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-suenos-violet to-suenos-cyan flex items-center justify-center text-xs font-bold text-white">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-suenos-muted hover:text-suenos-text transition-colors hidden lg:inline">
                  {user?.nombre}
                </span>
              </Link>

              <button
                onClick={logout}
                className="btn-ghost text-sm text-suenos-dim hover:text-red-400 ml-1"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost text-sm">
                Iniciar sesión
              </Link>
              <Link href="/auth/registro" className="btn-primary text-sm ml-2">
                Registrarse
              </Link>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden btn-ghost p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-suenos-border bg-suenos-midnight/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-2">
            <Link href="/cursos" className="block btn-ghost text-sm w-full text-left" onClick={() => setMobileOpen(false)}>
              <BookOpen className="w-4 h-4 inline mr-2" /> Cursos
            </Link>
            {isAuthenticated ? (
              <>
                {hasRole('estudiante') && (
                  <Link href="/dashboard" className="block btn-ghost text-sm w-full text-left" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard className="w-4 h-4 inline mr-2" /> Mis Cursos
                  </Link>
                )}
                {hasRole('instructor') && (
                  <Link href="/instructor" className="block btn-ghost text-sm w-full text-left" onClick={() => setMobileOpen(false)}>
                    <BookOpen className="w-4 h-4 inline mr-2" /> Instructor
                  </Link>
                )}
                {hasRole('admin') && (
                  <Link href="/admin" className="block btn-ghost text-sm w-full text-left" onClick={() => setMobileOpen(false)}>
                    <Shield className="w-4 h-4 inline mr-2" /> Admin
                  </Link>
                )}
                <div className="h-px bg-suenos-border my-2" />
                <Link href="/perfil" className="block btn-ghost text-sm w-full text-left" onClick={() => setMobileOpen(false)}>
                  Mi perfil
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="block btn-ghost text-sm w-full text-left text-red-400"
                >
                  <LogOut className="w-4 h-4 inline mr-2" /> Salir
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block btn-ghost text-sm w-full text-left" onClick={() => setMobileOpen(false)}>
                  Iniciar sesión
                </Link>
                <Link href="/auth/registro" className="block btn-primary text-sm w-full text-center mt-2" onClick={() => setMobileOpen(false)}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
