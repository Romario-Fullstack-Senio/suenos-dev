'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          Suenos Dev
        </Link>
        <nav className="flex gap-6 items-center">
          <Link href="/cursos" className="hover:text-primary transition">
            Cursos
          </Link>
          {isAuthenticated ? (
            <>
              {hasRole('estudiante') && (
                <Link href="/dashboard" className="hover:text-primary transition">
                  Mis Cursos
                </Link>
              )}
              {hasRole('instructor') && (
                <Link href="/instructor" className="hover:text-primary transition">
                  Instructor
                </Link>
              )}
              {hasRole('admin') && (
                <Link href="/admin" className="hover:text-primary transition">
                  Admin
                </Link>
              )}
              <Link href="/perfil" className="hover:text-primary transition">
                {user?.nombre}
              </Link>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-500 transition"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-primary transition">
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/registro"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
              >
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
