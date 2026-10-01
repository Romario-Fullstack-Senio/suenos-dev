import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Protección de rutas SERVER-SIDE. Antes de esto, `/dashboard`, `/admin`,
 * `/instructor`, etc. solo estaban guardadas por `AuthContext` en el
 * cliente — cualquiera podía pedir el HTML/JS de esas páginas directo
 * (curl, ver-código-fuente, deshabilitar JS) antes de que el redirect
 * client-side siquiera corriera. Este proxy (ex-middleware, ver Next 16)
 * corre en el servidor antes de renderizar nada.
 *
 * IMPORTANTE: esto es un gate de UX/routing, no la autorización real. La
 * autorización real sigue siendo 100% el JwtAuthGuard/RolesGuard de la API
 * validando el access token de vida corta en cada request — este
 * middleware solo lee el `sessionToken` (JWT de vida larga, purpose:
 * 'session-hint', ver LoginUseCase en la API) guardado en una cookie NO
 * httpOnly (la escribe AuthContext vía document.cookie, mismo nivel de
 * exposición a XSS que ya tenía el token en localStorage — no es una
 * regresión). Ese sessionToken JAMÁS es aceptado por la API como bearer
 * token (JwtStrategy lo rechaza explícitamente por su `purpose`).
 */

// En producción no hay valor por defecto: si falta JWT_SECRET, ninguna sesión
// se da por válida (fail closed). Antes caía a 'dev-secret', el mismo valor
// público del repo — con él cualquiera podía firmar una cookie con rol admin
// y pasar el gate de /admin.
const secretoCrudo =
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-secret');
const JWT_SECRET = secretoCrudo ? new TextEncoder().encode(secretoCrudo) : null;

// Prefijos que requieren sesión. `/instructor` y `/admin` además requieren
// el rol correspondiente (ver ROLE_PREFIXES).
const PROTECTED_PREFIXES = ['/dashboard', '/checkout', '/aprender', '/perfil', '/instructor', '/admin', '/favoritos', '/soporte', '/comunidad/nuevo', '/logros'];

// Rutas protegidas SOLO en su forma exacta, sin cubrir lo que cuelga debajo.
// `/certificados` es la lista de MIS certificados (privada), pero
// `/certificados/[id]` es la verificación pública de un certificado —
// justamente el link que se comparte en LinkedIn, tiene que abrir sin login.
const PROTECTED_EXACT = ['/certificados'];

const ROLE_PREFIXES: Record<string, string> = {
  '/admin': 'admin',
  '/instructor': 'instructor',
};

// Next 16 renombró la convención `middleware` a `proxy` (y la función
// exportada también). Corre siempre en runtime Node — antes era Edge — así
// que process.env.JWT_SECRET se lee en ejecución, no al compilar.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPrefix =
    PROTECTED_PREFIXES.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ??
    PROTECTED_EXACT.find((ruta) => pathname === ruta);
  if (!protectedPrefix) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session_token')?.value;
  if (!sessionCookie || !JWT_SECRET) {
    return redirectToLogin(request);
  }

  let rol: string | undefined;
  try {
    const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
    if (payload.purpose !== 'session-hint') {
      return redirectToLogin(request);
    }
    rol = typeof payload.rol === 'string' ? payload.rol : undefined;
  } catch {
    // Firma inválida o vencido — cookie no confiable, tratamos como no logueado.
    return redirectToLogin(request);
  }

  const requiredRole = ROLE_PREFIXES[protectedPrefix];
  if (requiredRole && rol !== requiredRole && rol !== 'admin') {
    // Un admin puede entrar a /instructor; nadie más entra a una sección
    // de otro rol — lo mandamos a su propio panel en vez de a login (ya
    // está logueado, solo no tiene permiso acá).
    const fallback = rol === 'instructor' ? '/instructor' : rol === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const url = new URL('/auth/login', request.url);
  url.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

// `/certificados` va SIN `:path*` a propósito: la verificación pública
// `/certificados/[id]` no debe pasar por el middleware.
export const config = {
  matcher: ['/dashboard/:path*', '/checkout/:path*', '/aprender/:path*', '/perfil/:path*', '/instructor/:path*', '/admin/:path*', '/favoritos/:path*', '/soporte/:path*', '/comunidad/nuevo/:path*', '/comunidad/nuevo', '/logros/:path*', '/logros', '/certificados'],
};
