'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className="relative py-1.5 text-[15px] font-semibold text-ink-muted transition hover:text-primary"
    >
      {children}
      {active && <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded bg-primary" />}
    </Link>
  );
}

function CloudMark() {
  return (
    <div
      className="flex h-[38px] w-[38px] items-center justify-center rounded-full"
      style={{
        background: 'linear-gradient(140deg,#8b5cf6,#6366f1)',
        boxShadow: '0 10px 22px -8px rgba(99,102,241,0.6)',
      }}
    >
      <div className="relative h-[11px] w-5">
        {/* Marca fija sobre el degradé morado — se mantiene blanca en ambos temas */}
        <div className="absolute left-1 top-0 h-[11px] w-[11px] rounded-full bg-white" />
        <div className="absolute left-3 top-[3px] h-2 w-2 rounded-full bg-white" />
        <div className="absolute bottom-0 left-0 h-[7px] w-5 rounded-full bg-white" />
      </div>
    </div>
  );
}

export function Header() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/[0.07] bg-cloud-50/[0.78] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <CloudMark />
          <span className="text-xl font-extrabold tracking-tight text-ink">
            Sueños <span className="text-primary">Dev</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <NavLink href="/cursos">Cursos</NavLink>

          {isAuthenticated ? (
            <>
              {hasRole('estudiante') && <NavLink href="/dashboard">Mis Cursos</NavLink>}
              {hasRole('estudiante') && <NavLink href="/certificados">Certificados</NavLink>}
              {hasRole('instructor') && <NavLink href="/instructor">Instructor</NavLink>}
              {hasRole('admin') && <NavLink href="/admin">Admin</NavLink>}

              <span className="h-6 w-px bg-ink/10" />

              <NotificationBell />

              <Link
                href="/perfil"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: 'linear-gradient(140deg,#8b5cf6,#6366f1)' }}
                title={user?.nombre}
              >
                {user?.nombre?.charAt(0).toUpperCase()}
              </Link>

              <button
                onClick={logout}
                className="text-sm font-semibold text-ink-muted transition hover:text-red-500"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-[15px] font-semibold text-ink-muted transition hover:text-primary"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/registro"
                className="rounded-xl bg-primary px-4 py-2 font-semibold text-white transition hover:bg-indigo-600"
                style={{ boxShadow: '0 14px 28px -14px rgba(99,102,241,0.7)' }}
              >
                Registrarse
              </Link>
            </>
          )}

          <span className="h-6 w-px bg-ink/10" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
