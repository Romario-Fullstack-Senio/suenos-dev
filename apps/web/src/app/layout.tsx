import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CartProvider } from '@/contexts/CartContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sky } from '@/components/layout/Sky';
import { CookieConsent } from '@/components/CookieConsent';

// Aplica la clase .dark a <html> ANTES del primer paint (localStorage no es
// accesible durante el render en servidor), para que no haya un flash de
// tema incorrecto al cargar. Debe ser síncrono y correr en <head>.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('suenos-theme');var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Sueños Dev - Plataforma de E-Learning',
    template: '%s | Sueños Dev',
  },
  description: 'Aprende desarrollo web con cursos practicos y certificados verificables.',
  openGraph: {
    siteName: 'Sueños Dev',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="relative min-h-screen overflow-x-hidden bg-cloud-50 text-ink">
        <ThemeProvider>
          <Sky />
          <AuthProvider>
            <CartProvider>
              <Header />
              <main className="relative z-[1]">{children}</main>
              <Footer />
              <CookieConsent />
            </CartProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
