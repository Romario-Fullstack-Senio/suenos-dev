import type { Metadata } from 'next';

// Login, registro, recuperar contraseña, etc.: páginas útiles para el
// usuario pero sin valor en buscadores — noindex para que no compitan con el
// catálogo ni aparezcan como resultado. `follow` deja que Google siga los
// links que salen de acá (al catálogo, términos, etc.).
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
