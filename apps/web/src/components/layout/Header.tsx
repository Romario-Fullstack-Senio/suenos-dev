'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  ShoppingCart,
  X,
  ChevronDown,
  BookOpen,
  Heart,
  Award,
  Trophy,
  LifeBuoy,
  User,
  LogOut,
  PenSquare,
  Shield,
} from 'lucide-react';
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
        background: 'linear-gradient(140deg,#fbbf24,#d97706)',
        boxShadow: '0 10px 22px -8px rgba(217,119,6,0.6)',
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

function Avatar({
  nombre,
  avatarUrl,
  size = 34,
}: {
  nombre?: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
      style={{ width: size, height: size, background: 'linear-gradient(140deg,#fbbf24,#d97706)' }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- viene de MinIO/Google/GitHub, no del pipeline de imágenes de Next
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        nombre?.charAt(0).toUpperCase()
      )}
    </span>
  );
}

const ITEM_CLASS =
  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[15px] font-semibold text-ink-muted transition hover:bg-cloud-100 hover:text-primary';

export function Header() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const cuentaRef = useRef<HTMLDivElement>(null);

  // Cerrar el panel mobile al navegar — sin esto quedaba abierto tapando la
  // página nueva hasta que el usuario lo tocara de nuevo.
  useEffect(() => {
    setMenuAbierto(false);
    setCuentaAbierta(false);
  }, [pathname]);

  // Click afuera y Escape cierran el menú de cuenta.
  useEffect(() => {
    if (!cuentaAbierta) return;
    const alClickear = (e: MouseEvent) => {
      if (cuentaRef.current && !cuentaRef.current.contains(e.target as Node)) setCuentaAbierta(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCuentaAbierta(false);
    };
    document.addEventListener('mousedown', alClickear);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alClickear);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [cuentaAbierta]);

  /**
   * Todo lo personal (cuenta, progreso, rol) vive acá dentro. Antes estaba
   * suelto en la barra: un estudiante logueado veía 14 elementos en una sola
   * fila —Cursos, Paquetes, Comunidad, Mis Cursos, Favoritos, Certificados,
   * Logros, Soporte, carrito, campana, avatar, Salir y el toggle de tema—
   * todos al mismo peso visual, sin jerarquía entre navegación de producto y
   * cuenta personal, y al borde del desborde entre 768 y 1000px.
   */
  const itemsDeCuenta = (cerrar: () => void) => (
    <>
      {hasRole('estudiante') && (
        <>
          <Link href="/dashboard" onClick={cerrar} className={ITEM_CLASS}>
            <BookOpen className="h-4 w-4" aria-hidden /> Mis Cursos
          </Link>
          <Link href="/favoritos" onClick={cerrar} className={ITEM_CLASS}>
            <Heart className="h-4 w-4" aria-hidden /> Favoritos
          </Link>
          <Link href="/certificados" onClick={cerrar} className={ITEM_CLASS}>
            <Award className="h-4 w-4" aria-hidden /> Certificados
          </Link>
          <Link href="/logros" onClick={cerrar} className={ITEM_CLASS}>
            <Trophy className="h-4 w-4" aria-hidden /> Logros
          </Link>
        </>
      )}
      {(hasRole('instructor') || hasRole('admin')) && (
        <>
          <div className="my-1 h-px bg-ink/[0.07]" />
          {hasRole('instructor') && (
            <Link href="/instructor" onClick={cerrar} className={ITEM_CLASS}>
              <PenSquare className="h-4 w-4" aria-hidden /> Panel de instructor
            </Link>
          )}
          {hasRole('admin') && (
            <Link href="/admin" onClick={cerrar} className={ITEM_CLASS}>
              <Shield className="h-4 w-4" aria-hidden /> Administración
            </Link>
          )}
        </>
      )}
      <div className="my-1 h-px bg-ink/[0.07]" />
      <Link href="/perfil" onClick={cerrar} className={ITEM_CLASS}>
        <User className="h-4 w-4" aria-hidden /> Mi perfil
      </Link>
      <Link href="/soporte" onClick={cerrar} className={ITEM_CLASS}>
        <LifeBuoy className="h-4 w-4" aria-hidden /> Soporte
      </Link>
      <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2">
        <span className="text-[15px] font-semibold text-ink-muted">Tema</span>
        <ThemeToggle />
      </div>
      <div className="my-1 h-px bg-ink/[0.07]" />
      <button
        type="button"
        onClick={() => {
          cerrar();
          logout();
        }}
        className={`${ITEM_CLASS} w-full text-left hover:text-danger`}
      >
        <LogOut className="h-4 w-4" aria-hidden /> Salir
      </button>
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

        {/* Solo navegación de producto en la barra: tres links fijos, más
            carrito, notificaciones y el menú de cuenta. */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink href="/cursos">Cursos</NavLink>
          <NavLink href="/paquetes">Paquetes</NavLink>
          <NavLink href="/comunidad">Comunidad</NavLink>

          <span className="h-6 w-px bg-ink/10" />
          <CartIcon />

          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="relative" ref={cuentaRef}>
                <button
                  type="button"
                  onClick={() => setCuentaAbierta((v) => !v)}
                  aria-expanded={cuentaAbierta}
                  aria-haspopup="menu"
                  aria-label="Menú de cuenta"
                  className="flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-1.5 text-ink-muted transition hover:text-primary"
                >
                  <Avatar nombre={user?.nombre} avatarUrl={user?.avatarUrl} />
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${cuentaAbierta ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>

                {cuentaAbierta && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-ink/[0.07] bg-cloud-50 p-2"
                    style={{ boxShadow: '0 24px 48px -20px rgba(20,22,43,0.35)' }}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <Avatar nombre={user?.nombre} avatarUrl={user?.avatarUrl} size={38} />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink">{user?.nombre}</p>
                        <p className="truncate text-xs text-ink-soft">{user?.email}</p>
                      </div>
                    </div>
                    <div className="my-1 h-px bg-ink/[0.07]" />
                    {itemsDeCuenta(() => setCuentaAbierta(false))}
                  </div>
                )}
              </div>
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
                className="rounded-xl bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary/90"
                style={{ boxShadow: '0 14px 28px -14px rgba(217,119,6,0.7)' }}
              >
                Registrarse
              </Link>
              <span className="h-6 w-px bg-ink/10" />
              <ThemeToggle />
            </>
          )}
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
              <div className="my-2 flex items-center gap-3">
                <Avatar nombre={user?.nombre} avatarUrl={user?.avatarUrl} size={38} />
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{user?.nombre}</p>
                  <p className="truncate text-xs text-ink-soft">{user?.email}</p>
                </div>
              </div>
              <div className="mb-1 h-px bg-ink/10" />
              <div className="-mx-3 flex flex-col">{itemsDeCuenta(() => setMenuAbierto(false))}</div>
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
                className="mt-1 w-fit rounded-xl bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary/90"
              >
                Registrarse
              </Link>
              <div className="my-2 h-px bg-ink/10" />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[15px] font-semibold text-ink-muted">Tema</span>
                <ThemeToggle />
              </div>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
