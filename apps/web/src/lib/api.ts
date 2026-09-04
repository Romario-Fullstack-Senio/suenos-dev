const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

/** Cookie no-httpOnly leída por middleware.ts para el gate de rutas
 * server-side — ver el comment grande en ese archivo para el porqué. */
function setSessionCookie(sessionToken: string) {
  if (typeof document === 'undefined') return;
  const maxAgeSeconds = 30 * 24 * 60 * 60; // 30 días, igual que el sessionToken
  document.cookie = `session_token=${sessionToken}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearSessionCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'session_token=; path=/; max-age=0';
}

/** Persiste los 3 tokens de una respuesta de login/refresh y sincroniza la
 * cookie que usa el middleware. Usado por AuthContext y por el auto-refresh
 * de acá abajo. */
export function setTokens(tokens: { token: string; refreshToken: string; sessionToken: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', tokens.token);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  setSessionCookie(tokens.sessionToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  clearSessionCookie();
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Evita que múltiples 401 simultáneos disparen varios refresh en paralelo —
// todos esperan la misma promesa in-flight.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json();
        setTokens(data);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function parseErrorOrThrow(res: Response): Promise<never> {
  const error = await res.json().catch(() => ({ message: `API error: ${res.status}` }));
  throw new Error(error.message || `API error: ${res.status}`);
}

/** Wrapper común: en un 401 (y solo si hay refreshToken guardado) intenta
 * refrescar la sesión una vez y reintenta la request original antes de
 * darse por vencido. Las rutas de auth mismas (login/registro/refresh) no
 * pasan por acá — se llaman directo con fetch. */
async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res = await fetch(`${API_URL}${path}`, init);

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(`${API_URL}${path}`, { ...init, headers: getAuthHeaders() });
    }
  }

  if (!res.ok) {
    if (res.status === 401) clearTokens();
    return parseErrorOrThrow(res);
  }
  return res.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { headers: getAuthHeaders() });
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
