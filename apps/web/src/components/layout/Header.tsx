'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

function CartIcon() {
  const { items } = useCart();
  return (
    <Link href="/carrito" className="relative text-ink-muted transition hover:text-primary" aria-label="Carrito">
      <ShoppingCart className="w-5 h-5" />
      {items.length > 0 && (
        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {items.length}
        </span>
      )}
    </Link>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
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
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cerrar el panel mobile al navegar — sin esto quedaba abierto tapando la
  // página nueva hasta que el usuario lo tocara de nuevo.
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  const linksAutenticado = (cerrar?: () => void) => (
    <>
      {hasRole('estudiante') && (
        <NavLink href="/dashboard" onClick={cerrar}>
          Mis Cursos
        </NavLink>
      )}
      {hasRole('estudiante') && (
        <NavLink href="/favoritos" onClick={cerrar}>
          Favoritos
        </NavLink>
      )}
      {hasRole('estudiante') && (
        <NavLink href="/certificados" onClick={cerrar}>
          Certificados
        </NavLink>
      )}
      {hasRole('estudiante') && (
        <NavLink href="/logros" onClick={cerrar}>
          Logros
        </NavLink>
      )}
      {hasRole('instructor') && (
        <NavLink href="/instructor" onClick={cerrar}>
          Instructor
        </NavLink>
      )}
      {hasRole('admin') && (
        <NavLink href="/admin" onClick={cerrar}>
          Admin
        </NavLink>
      )}
      <NavLink href="/soporte" onClick={cerrar}>
        Soporte
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-ink/[0.07] bg-cloud-50/[0.78] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <CloudMark />
          <span className="text-xl font-extrabold tracking-tight text-ink">
            Sueños <span className="text-primary">Dev</span>
          </span>
        </Link>

        {/* Nav completa — desde md hacia arriba entran las ~10 entradas sin
            problema; debajo de eso se recorta contra el borde de la pantalla
            (probado en 375px: "Mis Cursos" queda cortado y todo lo que sigue
            —Favoritos, Certificados, carrito, perfil, Salir— directamente
            inalcanzable, sin scroll ni menú). */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink href="/cursos">Cursos</NavLink>
          <NavLink href="/paquetes">Paquetes</NavLink>
          <NavLink href="/comunidad">Comunidad</NavLink>

          {isAuthenticated ? (
            <>
              {linksAutenticado()}
              <span className="h-6 w-px bg-ink/10" />
              <CartIcon />
              <NotificationBell />
              <Link
                href="/perfil"
                className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
                style={{ background: 'linear-gradient(140deg,#8b5cf6,#6366f1)' }}
                title={user?.nombre}
              >
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- viene de MinIO/Google/GitHub, no del pipeline de imágenes de Next
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.nombre?.charAt(0).toUpperCase()
                )}
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
              <CartIcon />
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

        {/* Mobile: solo carrito + notificaciones + hamburguesa a la vista; el
            resto vive en el panel desplegable de abajo. */}
        <div className="flex items-center gap-4 md:hidden">
          <CartIcon />
          {isAuthenticated && <NotificationBell />}
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            className="text-ink-muted transition hover:text-primary"
          >
            {menuAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <nav className="flex flex-col gap-1 border-t border-ink/[0.07] bg-cloud-50 px-4 py-4 md:hidden">
          <NavLink href="/cursos" onClick={() => setMenuAbierto(false)}>
            Cursos
          </NavLink>
          <NavLink href="/paquetes" onClick={() => setMenuAbierto(false)}>
            Paquetes
          </NavLink>
          <NavLink href="/comunidad" onClick={() => setMenuAbierto(false)}>
            Comunidad
          </NavLink>

          {isAuthenticated ? (
            <>
              {linksAutenticado(() => setMenuAbierto(false))}
              <div className="my-2 h-px bg-ink/10" />
              <Link
                href="/perfil"
                onClick={() => setMenuAbierto(false)}
                className="py-1.5 text-[15px] font-semibold text-ink-muted transition hover:text-primary"
              >
                {user?.nombre ?? 'Mi perfil'}
              </Link>
              <button
                onClick={() => {
                  setMenuAbierto(false);
                  logout();
                }}
                className="py-1.5 text-left text-[15px] font-semibold text-ink-muted transition hover:text-red-500"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <div className="my-2 h-px bg-ink/10" />
              <Link
                href="/auth/login"
                onClick={() => setMenuAbierto(false)}
                className="py-1.5 text-[15px] font-semibold text-ink-muted transition hover:text-primary"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/registro"
                onClick={() => setMenuAbierto(false)}
                className="mt-1 w-fit rounded-xl bg-primary px-4 py-2 font-semibold text-white transition hover:bg-indigo-600"
              >
                Registrarse
              </Link>
            </>
          )}

          <div className="my-2 h-px bg-ink/10" />
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[15px] font-semibold text-ink-muted">Tema</span>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
